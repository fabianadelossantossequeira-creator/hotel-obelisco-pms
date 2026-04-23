from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta

from ..database import get_db
from ..models import DailyClosure, Folio, Room, Charge, RoomStatus
from ..schemas import DailyClosureCreate, DailyClosureResponse

router = APIRouter(prefix="/closure", tags=["Cierre del Día"])

@router.post("/daily", response_model=DailyClosureResponse)
def create_daily_closure(request: DailyClosureCreate, db: Session = Depends(get_db)):
    """Realizar el cierre del día (Auditoría Nocturna)"""
    today = date.today()
    
    # Verificar si ya existe un cierre para hoy
    existing = db.query(DailyClosure).filter(DailyClosure.closure_date == today).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un cierre para el día de hoy")
    
    # Calcular ingresos del día (check-outs de hoy)
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    folios_today = db.query(Folio).filter(
        Folio.check_out >= today_start,
        Folio.check_out <= today_end
    ).all()
    
    total_revenue = sum(f.total_charges for f in folios_today)
    
    # Ingresos por alojamiento
    room_revenue = sum(
        c.amount for f in folios_today
        for c in f.charges if c.charge_type == "room"
    )
    
    # Ingresos por alimentos y bebidas
    fb_revenue = sum(
        c.amount for f in folios_today
        for c in f.charges if c.charge_type in ["restaurant", "bar", "breakfast"]
    )
    
    # Otros ingresos
    other_revenue = total_revenue - room_revenue - fb_revenue
    
    # Contar check-ins y check-outs del día
    check_ins = db.query(Folio).filter(
        Folio.check_in >= today_start,
        Folio.check_in <= today_end
    ).count()
    
    check_outs = len(folios_today)
    
    # Calcular ocupación
    total_rooms = db.query(Room).count()
    occupied_rooms = db.query(Room).filter(Room.status == RoomStatus.OCCUPIED).count()
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    # Calcular efectivo recibido (pagos en efectivo)
    cash_received = sum(
        f.total_charges for f in folios_today 
        if f.payment_method and f.payment_method.value == "cash"
    )
    
    # Calcular diferencia de caja
    difference = request.actual_cash_counted - (request.initial_cash + cash_received)
    
    # Crear registro de cierre
    closure = DailyClosure(
        closure_date=today,
        initial_cash=request.initial_cash,
        cash_received=cash_received,
        cash_paid_out=0.0,
        actual_cash_counted=request.actual_cash_counted,
        difference=difference,
        total_revenue=total_revenue,
        room_revenue=room_revenue,
        fb_revenue=fb_revenue,
        other_revenue=other_revenue,
        occupancy_rate=occupancy_rate,
        adr=(room_revenue / occupied_rooms) if occupied_rooms > 0 else 0,
        revpar=(room_revenue / total_rooms) if total_rooms > 0 else 0,
        check_ins_count=check_ins,
        check_outs_count=check_outs,
        no_shows_count=0,
        closed_by=request.closed_by,
        closed_at=datetime.now()
    )
    db.add(closure)
    db.commit()
    db.refresh(closure)
    
    return closure

@router.get("/daily/{closure_date}")
def get_daily_closure(closure_date: date, db: Session = Depends(get_db)):
    """Obtener el cierre de un día específico"""
    closure = db.query(DailyClosure).filter(DailyClosure.closure_date == closure_date).first()
    if not closure:
        raise HTTPException(status_code=404, detail="No se encontró cierre para esa fecha")
    return closure

@router.get("/daily")
def get_all_closures(db: Session = Depends(get_db)):
    """Obtener todos los cierres diarios"""
    closures = db.query(DailyClosure).order_by(DailyClosure.closure_date.desc()).all()
    return closures

@router.get("/today-summary")
def get_today_summary(db: Session = Depends(get_db)):
    """Obtener resumen del día actual (sin cerrar)"""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    
    # Check-ins de hoy
    check_ins = db.query(Folio).filter(
        Folio.check_in >= today_start
    ).count()
    
    # Huéspedes activos
    active_guests = db.query(Folio).filter(Folio.is_active == True).count()
    
    # Habitaciones ocupadas
    occupied = db.query(Room).filter(Room.status == RoomStatus.OCCUPIED).count()
    
    # Habitaciones sucias
    dirty = db.query(Room).filter(Room.status == RoomStatus.DIRTY).count()
    
    # Habitaciones limpias
    clean = db.query(Room).filter(Room.status == RoomStatus.CLEAN).count()
    
    # Total habitaciones
    total = db.query(Room).count()
    
    return {
        "date": today.isoformat(),
        "check_ins_today": check_ins,
        "active_guests": active_guests,
        "rooms": {
            "occupied": occupied,
            "dirty": dirty,
            "clean": clean,
            "total": total
        },
        "occupancy_rate": (occupied / total * 100) if total > 0 else 0
    }
