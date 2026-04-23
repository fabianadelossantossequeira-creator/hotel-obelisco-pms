from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Room, Folio, Charge, ChargeType, IVAType, MenuCategory, MenuItem
from ..schemas import MenuCategoryResponse

router = APIRouter(prefix="/pos", tags=["Restaurante/TPV"])

# ============================================
# CARGOS A HABITACIÓN
# ============================================
@router.post("/charge-to-room")
def charge_to_room(
    room_number: str,
    amount: float,
    description: str,
    db: Session = Depends(get_db)
):
    """Cargar consumo de restaurante/bar a la habitación"""
    room = db.query(Room).filter(Room.room_number == room_number).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    
    active_folio = db.query(Folio).filter(
        Folio.room_id == room.id,
        Folio.is_active == True
    ).first()
    
    if not active_folio:
        raise HTTPException(status_code=400, detail="No hay huésped activo en esta habitación")
    
    new_charge = Charge(
        folio_id=active_folio.id,
        amount=amount,
        description=f"Restaurante: {description}",
        charge_type=ChargeType.RESTAURANT,
        iva_type=IVAType.IVA_22
    )
    db.add(new_charge)
    
    active_folio.total_charges += amount
    active_folio.subtotal += amount
    active_folio.iva_22 += amount * 0.22
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Cargo aplicado exitosamente",
        "guest": active_folio.guest_name,
        "room": room_number,
        "amount": amount,
        "folio_total": active_folio.total_charges
    }

# ============================================
# MENÚ
# ============================================
@router.get("/menu", response_model=List[MenuCategoryResponse])
def get_full_menu(db: Session = Depends(get_db)):
    """Obtener el menú completo con categorías e items"""
    categories = db.query(MenuCategory).filter(MenuCategory.is_active == True).all()
    
    result = []
    for cat in categories:
        items = db.query(MenuItem).filter(
            MenuItem.category_id == cat.id,
            MenuItem.is_available == True
        ).all()
        
        result.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "items": [
                {
                    "id": item.id,
                    "code": item.code,
                    "name": item.name,
                    "description": item.description,
                    "price": item.price,
                    "category_id": cat.id,
                    "category_name": cat.name,
                    "meal_period": item.meal_period,
                    "is_available": item.is_available
                }
                for item in items
            ]
        })
    
    return result

@router.get("/menu/categories")
def get_categories(db: Session = Depends(get_db)):
    """Obtener categorías del menú"""
    return db.query(MenuCategory).filter(MenuCategory.is_active == True).all()

@router.get("/menu/items")
def get_items(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Obtener items del menú"""
    query = db.query(MenuItem).filter(MenuItem.is_available == True)
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    return query.all()

# ============================================
# INICIALIZAR MENÚ (Datos de ejemplo)
# ============================================
@router.post("/menu/init")
def initialize_menu(db: Session = Depends(get_db)):
    """Crea el menú completo con precios de Salto, Uruguay"""
    
    existing = db.query(MenuCategory).first()
    if existing:
        return {"message": "El menú ya está inicializado", "status": "ok"}
    
    # Categorías
    categories = [
        MenuCategory(name="Desayunos", description="7:00 - 10:30"),
        MenuCategory(name="Almuerzos", description="12:00 - 15:30"),
        MenuCategory(name="Cenas", description="19:30 - 22:30"),
        MenuCategory(name="Cafetería", description="Todo el día"),
        MenuCategory(name="Bar", description="18:00 - 00:00"),
    ]
    for cat in categories:
        db.add(cat)
    db.commit()
    
    # Items
    items = [
        # Desayunos
        MenuItem(category_id=1, code="DES-01", name="Desayuno Continental", description="Café/Té + Medialunas + Jugo", price=380, meal_period="desayuno"),
        MenuItem(category_id=1, code="DES-02", name="Desayuno Americano", description="Continental + Huevos + Fruta", price=550, meal_period="desayuno"),
        MenuItem(category_id=1, code="DES-03", name="Desayuno Buffet", description="Acceso libre al buffet", price=650, meal_period="desayuno"),
        # Almuerzos
        MenuItem(category_id=2, code="ALM-01", name="Milanesa con Papas", description="Carne o Pollo", price=580, meal_period="almuerzo"),
        MenuItem(category_id=2, code="ALM-02", name="Chivito Uruguayo", description="Lomo completo + Papas", price=720, meal_period="almuerzo"),
        MenuItem(category_id=2, code="ALM-03", name="Pasta del Día", description="Ñoquis/Ravioles", price=450, meal_period="almuerzo"),
        MenuItem(category_id=2, code="ALM-04", name="Menú Ejecutivo", description="Entrada+Principal+Postre+Bebida", price=650, meal_period="almuerzo"),
        # Cenas
        MenuItem(category_id=3, code="CEN-01", name="Bife de Chorizo", description="400gr con guarnición", price=890, meal_period="cena"),
        MenuItem(category_id=3, code="CEN-02", name="Entraña a la Parrilla", description="Con chimichurri", price=850, meal_period="cena"),
        MenuItem(category_id=3, code="CEN-03", name="Parrillada para 2", description="Asado, chorizo, morcilla", price=1450, meal_period="cena"),
        # Cafetería
        MenuItem(category_id=4, code="CAF-01", name="Espresso", description=None, price=90, meal_period="todo_el_dia"),
        MenuItem(category_id=4, code="CAF-02", name="Cappuccino", description=None, price=140, meal_period="todo_el_dia"),
        MenuItem(category_id=4, code="CAF-03", name="Tostado", description="Jamón y Queso", price=220, meal_period="todo_el_dia"),
        # Bar
        MenuItem(category_id=5, code="BAR-01", name="Cerveza Nacional 1L", description=None, price=200, meal_period="bar"),
        MenuItem(category_id=5, code="BAR-02", name="Vino Tannat Copa", description=None, price=180, meal_period="bar"),
        MenuItem(category_id=5, code="BAR-03", name="Mojito", description=None, price=300, meal_period="bar"),
        MenuItem(category_id=5, code="BAR-04", name="Gin Tonic", description=None, price=350, meal_period="bar"),
    ]
    for item in items:
        db.add(item)
    db.commit()
    
    return {"message": "Menú inicializado con éxito", "categories": 5, "items": len(items)}
