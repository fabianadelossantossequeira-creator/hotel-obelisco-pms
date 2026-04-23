from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
import random
from typing import List

from ..database import get_db
from ..models import Reservation, Room, RoomStatus, ReservationSource
from ..schemas import ReservationCreate, ReservationResponse

router = APIRouter(prefix="/reservations", tags=["Reservas"])

def generate_reservation_code():
    """Genera código único: SAL-202604-1234"""
    year = datetime.now().year
    month = datetime.now().month
    random_num = random.randint(1000, 9999)
    return f"SAL-{year}{month:02d}-{random_num}"

@router.get("/", response_model=List[ReservationResponse])
def get_reservations(
    from_date: date = None,
    to_date: date = None,
    db: Session = Depends(get_db)
):
    """Obtener todas las reservas con filtros opcionales"""
    query = db.query(Reservation)
    
    if from_date:
        query = query.filter(Reservation.check_in >= from_date)
    if to_date:
        query = query.filter(Reservation.check_out <= to_date)
    
    return query.order_by(Reservation.check_in).all()

@router.post("/", response_model=ReservationResponse)
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db)):
    """Crear una nueva reserva (directa desde el hotel)"""
    # Verificar que la habitación existe
    room = db.query(Room).filter(Room.id == reservation.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    
    # Verificar disponibilidad
    overlapping = db.query(Reservation).filter(
        Reservation.room_id == reservation.room_id,
        Reservation.check_in < reservation.check_out,
        Reservation.check_out > reservation.check_in
    ).first()
    
    if overlapping:
        raise HTTPException(status_code=409, detail="Habitación ya reservada para esas fechas")
    
    # Generar código único
    reservation_code = generate_reservation_code()
    while db.query(Reservation).filter(Reservation.reservation_code == reservation_code).first():
        reservation_code = generate_reservation_code()
    
    db_reservation = Reservation(
        reservation_code=reservation_code,
        **reservation.dict()
    )
    db.add(db_reservation)
    
    # Marcar habitación como reservada si la fecha de check-in es hoy o futuro
    if reservation.check_in >= date.today():
        room.status = RoomStatus.RESERVED
    
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation

@router.get("/code/{reservation_code}")
def get_reservation_by_code(reservation_code: str, db: Session = Depends(get_db)):
    """Buscar reserva por código"""
    reservation = db.query(Reservation).filter(
        Reservation.reservation_code == reservation_code
    ).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reservation

@router.get("/upcoming/arrivals")
def get_upcoming_arrivals(db: Session = Depends(get_db)):
    """Obtener llegadas de hoy"""
    today = date.today()
    arrivals = db.query(Reservation).filter(
        Reservation.check_in == today
    ).all()
    return arrivals

@router.get("/upcoming/departures")
def get_upcoming_departures(db: Session = Depends(get_db)):
    """Obtener salidas de hoy"""
    today = date.today()
    departures = db.query(Reservation).filter(
        Reservation.check_out == today
    ).all()
    return departures

@router.delete("/{reservation_id}")
def cancel_reservation(reservation_id: int, db: Session = Depends(get_db)):
    """Cancelar una reserva"""
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Liberar habitación si no está ocupada
    room = db.query(Room).filter(Room.id == reservation.room_id).first()
    overlapping = db.query(Reservation).filter(
        Reservation.room_id == room.id,
        Reservation.id != reservation_id,
        Reservation.check_in < reservation.check_out,
        Reservation.check_out > reservation.check_in
    ).first()
    
    if not overlapping and room.status == RoomStatus.RESERVED:
        room.status = RoomStatus.CLEAN
    
    db.delete(reservation)
    db.commit()
    
    return {"message": "Reserva cancelada exitosamente"}
