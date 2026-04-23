from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Room, RoomStatus
from ..schemas import RoomCreate, RoomResponse

router = APIRouter(prefix="/rooms", tags=["Habitaciones"])

@router.get("/", response_model=List[RoomResponse])
def get_rooms(status: RoomStatus = None, db: Session = Depends(get_db)):
    """Obtener todas las habitaciones, opcionalmente filtradas por estado"""
    query = db.query(Room)
    if status:
        query = query.filter(Room.status == status)
    return query.order_by(Room.room_number).all()

@router.get("/available")
def get_available_rooms(db: Session = Depends(get_db)):
    """Obtener habitaciones disponibles (limpias)"""
    rooms = db.query(Room).filter(Room.status == RoomStatus.CLEAN).all()
    return [
        {
            "id": r.id,
            "room_number": r.room_number,
            "room_type": r.room_type,
            "base_price": r.base_price,
            "max_guests": r.max_guests,
            "description": r.description,
            "floor": r.floor
        }
        for r in rooms
    ]

@router.post("/", response_model=RoomResponse)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    """Crear una nueva habitación"""
    existing = db.query(Room).filter(Room.room_number == room.room_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="El número de habitación ya existe")
    
    db_room = Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.put("/{room_id}/status")
def update_room_status(room_id: int, status: RoomStatus, db: Session = Depends(get_db)):
    """Actualizar el estado de una habitación (limpia, sucia, ocupada, etc.)"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    
    room.status = status
    db.commit()
    return {"message": f"Habitación {room.room_number} actualizada a {status.value}"}

@router.get("/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db)):
    """Obtener detalles de una habitación específica"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    return room
