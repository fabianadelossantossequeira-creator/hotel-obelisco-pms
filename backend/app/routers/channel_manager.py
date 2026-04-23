from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import date, datetime
import random
from typing import Optional

from ..database import get_db
from ..models import Room, Reservation, RoomStatus, ReservationSource
from ..schemas import OTABookingRequest, OTABookingResponse

router = APIRouter(prefix="/channel-manager", tags=["Channel Manager - OTAs"])

def generate_reservation_code():
    """Genera código único: SAL-202604-1234"""
    year = datetime.now().year
    month = datetime.now().month
    random_num = random.randint(1000, 9999)
    return f"SAL-{year}{month:02d}-{random_num}"

def find_available_room(db: Session, room_type: str, check_in: date, check_out: date):
    """Busca una habitación disponible del tipo solicitado"""
    rooms = db.query(Room).filter(
        Room.room_type == room_type,
        Room.status == RoomStatus.CLEAN
    ).all()
    
    for room in rooms:
        # Verificar que no tenga reservas solapadas
        overlapping = db.query(Reservation).filter(
            Reservation.room_id == room.id,
            Reservation.check_in < check_out,
            Reservation.check_out > check_in
        ).first()
        
        if not overlapping:
            return room
    
    return None

@router.get("/availability")
def get_availability(room_type: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Consulta disponibilidad para las OTAs.
    Este endpoint es llamado por BookingClone y ExpediaClone.
    """
    query = db.query(Room).filter(Room.status == RoomStatus.CLEAN)
    
    if room_type:
        query = query.filter(Room.room_type == room_type)
    
    rooms = query.all()
    
    return [
        {
            "id": r.id,
            "room_number": r.room_number,
            "room_type": r.room_type,
            "base_price": r.base_price,
            "max_guests": r.max_guests,
            "description": r.description,
            "image_url": r.image_url or f"https://picsum.photos/400/300?random={r.id}",
            "floor": r.floor
        }
        for r in rooms
    ]

@router.post("/booking", response_model=OTABookingResponse)
def create_ota_booking(request: OTABookingRequest, db: Session = Depends(get_db)):
    """
    Recibe una reserva desde una OTA externa (BookingClone o ExpediaClone).
    Este es el endpoint MÁS IMPORTANTE para la integración.
    """
    print("\n" + "="*60)
    print(f"🔔 ¡NUEVA RESERVA DESDE {request.ota_name.upper()}!")
    print("="*60)
    print(f"   🏨 Hotel: Obelisco - Salto, Uruguay")
    print(f"   👤 Huésped: {request.guest_name}")
    print(f"   📧 Email: {request.guest_email or 'No proporcionado'}")
    print(f"   📞 Teléfono: {request.guest_phone or 'No proporcionado'}")
    print(f"   🚪 Tipo de habitación: {request.room_type}")
    print(f"   📅 Check-in: {request.check_in}")
    print(f"   📅 Check-out: {request.check_out}")
    print(f"   👥 Adultos: {request.adults} | Niños: {request.children}")
    print(f"   💵 Precio total: U$S {request.total_price}")
    print("="*60 + "\n")
    
    # Buscar habitación disponible
    available_room = find_available_room(
        db, 
        request.room_type, 
        request.check_in, 
        request.check_out
    )
    
    if not available_room:
        print(f"❌ NO HAY HABITACIONES DISPONIBLES tipo '{request.room_type}'")
        raise HTTPException(
            status_code=409,
            detail=f"No hay habitaciones tipo '{request.room_type}' disponibles para esas fechas"
        )
    
    # Mapear origen de la reserva
    source_map = {
        "booking_com": ReservationSource.BOOKING_COM,
        "expedia": ReservationSource.EXPEDIA
    }
    source = source_map.get(request.ota_name, ReservationSource.DIRECT)
    
    # Generar código único de reserva
    reservation_code = generate_reservation_code()
    while db.query(Reservation).filter(Reservation.reservation_code == reservation_code).first():
        reservation_code = generate_reservation_code()
    
    # Crear la reserva en el PMS
    new_reservation = Reservation(
        reservation_code=reservation_code,
        guest_name=request.guest_name,
        guest_email=request.guest_email,
        guest_phone=request.guest_phone,
        room_id=available_room.id,
        check_in=request.check_in,
        check_out=request.check_out,
        adults_count=request.adults,
        children_count=request.children,
        children_ages=request.children_ages,
        total_price=request.total_price,
        source=source,
        external_id=request.ota_booking_id,
        special_requests=[request.special_requests] if request.special_requests else []
    )
    db.add(new_reservation)
    
    # Marcar habitación como RESERVADA
    available_room.status = RoomStatus.RESERVED
    
    db.commit()
    db.refresh(new_reservation)
    
    print(f"✅ RESERVA CONFIRMADA!")
    print(f"   📋 Código de reserva: {reservation_code}")
    print(f"   🚪 Habitación asignada: {available_room.room_number}")
    print(f"   🏨 Estado actualizado en el PMS\n")
    
    return {
        "status": "success",
        "message": "Reserva confirmada exitosamente",
        "reservation_code": reservation_code,
        "room_number": available_room.room_number
    }

@router.get("/reservations/{external_id}")
def get_reservation_by_external_id(external_id: str, db: Session = Depends(get_db)):
    """Buscar reserva por ID externo de OTA"""
    reservation = db.query(Reservation).filter(
        Reservation.external_id == external_id
    ).first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    return {
        "reservation_code": reservation.reservation_code,
        "guest_name": reservation.guest_name,
        "room_number": reservation.room.room_number,
        "check_in": reservation.check_in,
        "check_out": reservation.check_out,
        "total_price": reservation.total_price,
        "source": reservation.source.value
    }
