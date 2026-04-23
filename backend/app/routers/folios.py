from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List

from ..database import get_db
from ..models import Folio, Room, RoomStatus, Charge, ChargeType, IVAType
from ..schemas import FolioResponse, CheckInRequest, CheckOutResponse, ChargeCreate

router = APIRouter(prefix="/folios", tags=["Folios - Check-in/Out"])

def calculate_nights(check_in: datetime, check_out: datetime) -> int:
    return max(1, (check_out - check_in).days)

@router.get("/", response_model=List[FolioResponse])
def get_folios(active_only: bool = False, db: Session = Depends(get_db)):
    """Obtener todos los folios (activos o todos)"""
    query = db.query(Folio)
    if active_only:
        query = query.filter(Folio.is_active == True)
    return query.order_by(Folio.check_in.desc()).all()

@router.get("/active")
def get_active_folios(db: Session = Depends(get_db)):
    """Obtener huéspedes actualmente en el hotel"""
    folios = db.query(Folio).filter(Folio.is_active == True).all()
    return [
        {
            "id": f.id,
            "guest_name": f.guest_name,
            "room_number": f.room.room_number,
            "check_in": f.check_in,
            "total_charges": f.total_charges
        }
        for f in folios
    ]

@router.post("/check-in", response_model=FolioResponse)
def check_in(request: CheckInRequest, db: Session = Depends(get_db)):
    """Realizar check-in de un huésped"""
    room = db.query(Room).filter(Room.id == request.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    
    if room.status != RoomStatus.CLEAN and room.status != RoomStatus.RESERVED:
        raise HTTPException(status_code=400, detail=f"Habitación no disponible")
    
    folio = Folio(
        guest_name=request.guest_name,
        guest_email=request.guest_email,
        guest_phone=request.guest_phone,
        guest_document=request.guest_document,
        guest_nationality=request.guest_nationality,
        guest_address=request.guest_address,
        room_id=request.room_id,
        check_in=datetime.now(),
        adults_count=request.adults_count,
        children_count=request.children_count,
        payment_method=request.payment_method,
        is_active=True
    )
    db.add(folio)
    room.status = RoomStatus.OCCUPIED
    db.commit()
    db.refresh(folio)
    return folio

@router.post("/check-out/{folio_id}", response_model=CheckOutResponse)
def check_out(folio_id: int, db: Session = Depends(get_db)):
    """Realizar check-out y generar factura"""
    folio = db.query(Folio).filter(Folio.id == folio_id).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio no encontrado")
    
    if not folio.is_active:
        raise HTTPException(status_code=400, detail="Este folio ya fue cerrado")
    
    check_out_time = datetime.now()
    nights = calculate_nights(folio.check_in, check_out_time)
    room = db.query(Room).filter(Room.id == folio.room_id).first()
    room_charge_amount = room.base_price * nights
    
    # Cargo de alojamiento con IVA 10%
    room_charge = Charge(
        folio_id=folio.id,
        amount=room_charge_amount,
        description=f"Alojamiento {nights} noche(s) - Hab. {room.room_number}",
        charge_type=ChargeType.ROOM,
        iva_type=IVAType.IVA_10
    )
    db.add(room_charge)
    
    folio.is_active = False
    folio.check_out = check_out_time
    folio.total_charges += room_charge_amount
    folio.subtotal += room_charge_amount
    folio.iva_10 += room_charge_amount * 0.10
    room.status = RoomStatus.DIRTY
    
    db.commit()
    db.refresh(folio)
    
    return {
        "folio_id": folio.id,
        "guest_name": folio.guest_name,
        "room_number": room.room_number,
        "check_in": folio.check_in,
        "check_out": check_out_time,
        "nights": nights,
        "subtotal": folio.subtotal,
        "iva_10": folio.iva_10,
        "iva_22": folio.iva_22,
        "total": folio.total_charges,
        "payment_method": folio.payment_method.value if folio.payment_method else "No especificado",
        "charges": folio.charges
    }

@router.post("/{folio_id}/charges")
def add_charge(folio_id: int, charge: ChargeCreate, db: Session = Depends(get_db)):
    """Agregar un cargo al folio (restaurante, minibar, etc.)"""
    folio = db.query(Folio).filter(Folio.id == folio_id).first()
    if not folio:
        raise HTTPException(status_code=404, detail="Folio no encontrado")
    
    if not folio.is_active:
        raise HTTPException(status_code=400, detail="No se pueden agregar cargos a un folio cerrado")
    
    db_charge = Charge(**charge.dict())
    db.add(db_charge)
    
    folio.total_charges += charge.amount
    folio.subtotal += charge.amount
    
    if charge.iva_type == IVAType.IVA_10:
        folio.iva_10 += charge.amount * 0.10
    elif charge.iva_type == IVAType.IVA_22:
        folio.iva_22 += charge.amount * 0.22
    
    db.commit()
    db.refresh(db_charge)
    
    return {"message": "Cargo agregado exitosamente", "charge_id": db_charge.id}
