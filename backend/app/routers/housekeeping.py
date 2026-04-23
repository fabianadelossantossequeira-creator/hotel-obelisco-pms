from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Room, RoomStatus, MinibarItem, Folio, Charge, ChargeType, IVAType

router = APIRouter(prefix="/housekeeping", tags=["Housekeeping"])

# ============================================
# GESTIÓN DE LIMPIEZA
# ============================================
@router.get("/dirty-rooms")
def get_dirty_rooms(db: Session = Depends(get_db)):
    """Obtener habitaciones que necesitan limpieza"""
    dirty = db.query(Room).filter(Room.status == RoomStatus.DIRTY).all()
    return [
        {
            "id": r.id,
            "room_number": r.room_number,
            "room_type": r.room_type,
            "floor": r.floor
        }
        for r in dirty
    ]

@router.put("/mark-clean/{room_id}")
def mark_room_clean(room_id: int, db: Session = Depends(get_db)):
    """Marcar habitación como limpia"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    
    room.status = RoomStatus.CLEAN
    db.commit()
    
    return {
        "message": f"Habitación {room.room_number} marcada como LIMPIA",
        "room_number": room.room_number
    }

@router.get("/clean-rooms")
def get_clean_rooms(db: Session = Depends(get_db)):
    """Obtener habitaciones limpias (disponibles para check-in)"""
    clean = db.query(Room).filter(Room.status == RoomStatus.CLEAN).all()
    return [
        {
            "id": r.id,
            "room_number": r.room_number,
            "room_type": r.room_type
        }
        for r in clean
    ]

# ============================================
# GESTIÓN DE MINIBAR
# ============================================
@router.post("/minibar/consumption")
def report_minibar_consumption(
    room_number: str,
    item_name: str,
    quantity: int,
    unit_price: float,
    db: Session = Depends(get_db)
):
    """Reportar consumo de minibar en una habitación"""
    room = db.query(Room).filter(Room.room_number == room_number).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    
    # Buscar folio activo
    active_folio = db.query(Folio).filter(
        Folio.room_id == room.id,
        Folio.is_active == True
    ).first()
    
    total_amount = quantity * unit_price
    
    # Registrar en minibar_items
    minibar_item = MinibarItem(
        room_id=room.id,
        folio_id=active_folio.id if active_folio else None,
        item_name=item_name,
        quantity=quantity,
        unit_price=unit_price,
        charged=False
    )
    db.add(minibar_item)
    
    # Si hay huésped activo, cargar automáticamente al folio
    if active_folio:
        charge = Charge(
            folio_id=active_folio.id,
            amount=total_amount,
            description=f"Minibar: {item_name} x{quantity}",
            charge_type=ChargeType.MINIBAR,
            iva_type=IVAType.IVA_22
        )
        db.add(charge)
        
        active_folio.total_charges += total_amount
        active_folio.subtotal += total_amount
        active_folio.iva_22 += total_amount * 0.22
        
        minibar_item.charged = True
    
    db.commit()
    
    return {
        "message": "Consumo de minibar registrado",
        "room": room_number,
        "item": item_name,
        "quantity": quantity,
        "unit_price": unit_price,
        "total": total_amount,
        "charged_to_folio": minibar_item.charged
    }

@router.get("/minibar/pending")
def get_pending_minibar(db: Session = Depends(get_db)):
    """Obtener consumos de minibar no cargados aún"""
    pending = db.query(MinibarItem).filter(MinibarItem.charged == False).all()
    return [
        {
            "id": item.id,
            "room_number": item.room.room_number,
            "item_name": item.item_name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total": item.quantity * item.unit_price,
            "created_at": item.created_at
        }
        for item in pending
    ]

# ============================================
# PRODUCTOS DE MINIBAR (Precios estándar)
# ============================================
@router.get("/minibar/products")
def get_minibar_products():
    """Obtener lista de productos de minibar con precios"""
    return [
        {"name": "Agua mineral sin gas", "price": 80},
        {"name": "Agua mineral con gas", "price": 80},
        {"name": "Coca-Cola", "price": 90},
        {"name": "Sprite", "price": 90},
        {"name": "Fanta", "price": 90},
        {"name": "Cerveza Pilsen", "price": 120},
        {"name": "Cerveza Patricia", "price": 120},
        {"name": "Snack (papas fritas)", "price": 100},
        {"name": "Mani", "price": 80},
        {"name": "Chocolate", "price": 110},
        {"name": "Vino tinto (mini)", "price": 280},
    ]
