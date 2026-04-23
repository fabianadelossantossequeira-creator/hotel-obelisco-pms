from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List
from .models import RoomStatus, ReservationSource, PaymentMethod, BreakfastType, ChargeType, IVAType

# ============================================
# HABITACIONES
# ============================================
class RoomBase(BaseModel):
    room_number: str
    room_type: str
    base_price: float
    max_guests: int = 2
    description: Optional[str] = None
    image_url: Optional[str] = None
    floor: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    status: RoomStatus
    
    class Config:
        from_attributes = True

# ============================================
# RESERVAS
# ============================================
class ReservationBase(BaseModel):
    guest_name: str
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    room_id: int
    check_in: date
    check_out: date
    adults_count: int = 1
    children_count: int = 0
    children_ages: Optional[List[int]] = []
    total_price: float
    source: ReservationSource = ReservationSource.DIRECT
    special_requests: Optional[List[str]] = []

class ReservationCreate(ReservationBase):
    pass

class ReservationResponse(ReservationBase):
    id: int
    reservation_code: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# FOLIOS
# ============================================
class FolioBase(BaseModel):
    guest_name: str
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_document: Optional[str] = None
    guest_nationality: Optional[str] = None
    guest_address: Optional[str] = None
    room_id: int
    adults_count: int = 1
    children_count: int = 0

class FolioCreate(FolioBase):
    check_in: datetime
    payment_method: Optional[PaymentMethod] = None

class ChargeResponse(BaseModel):
    id: int
    amount: float
    description: str
    charge_type: ChargeType
    iva_type: IVAType
    created_at: datetime
    
    class Config:
        from_attributes = True

class FolioResponse(FolioBase):
    id: int
    check_in: datetime
    check_out: Optional[datetime]
    total_charges: float
    subtotal: float
    iva_10: float
    iva_22: float
    is_active: bool
    payment_method: Optional[PaymentMethod]
    charges: List[ChargeResponse] = []
    
    class Config:
        from_attributes = True

# ============================================
# CARGOS
# ============================================
class ChargeCreate(BaseModel):
    folio_id: int
    amount: float
    description: str
    charge_type: ChargeType
    iva_type: IVAType = IVAType.IVA_22

# ============================================
# CHECK-IN / CHECK-OUT
# ============================================
class CheckInRequest(BaseModel):
    room_id: int
    guest_name: str
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    guest_document: Optional[str] = None
    guest_nationality: Optional[str] = None
    guest_address: Optional[str] = None
    adults_count: int = 1
    children_count: int = 0
    payment_method: PaymentMethod

class CheckOutResponse(BaseModel):
    folio_id: int
    guest_name: str
    room_number: str
    check_in: datetime
    check_out: datetime
    nights: int
    subtotal: float
    iva_10: float
    iva_22: float
    total: float
    payment_method: str
    charges: List[ChargeResponse]

# ============================================
# OTA (Channel Manager)
# ============================================
class OTABookingRequest(BaseModel):
    ota_name: str
    ota_booking_id: str
    guest_name: str
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    room_type: str
    check_in: date
    check_out: date
    adults: int = 1
    children: int = 0
    children_ages: Optional[List[int]] = []
    total_price: float
    special_requests: Optional[str] = None

class OTABookingResponse(BaseModel):
    status: str
    message: str
    reservation_code: str
    room_number: str

# ============================================
# MENÚ RESTAURANTE
# ============================================
class MenuItemResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    price: float
    category_id: int
    category_name: str
    meal_period: str
    is_available: bool
    
    class Config:
        from_attributes = True

class MenuCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    items: List[MenuItemResponse] = []
    
    class Config:
        from_attributes = True

# ============================================
# CIERRE DEL DÍA
# ============================================
class DailyClosureCreate(BaseModel):
    initial_cash: float = 0.0
    actual_cash_counted: float = 0.0
    closed_by: str

class DailyClosureResponse(BaseModel):
    id: int
    closure_date: date
    initial_cash: float
    cash_received: float
    actual_cash_counted: float
    difference: float
    total_revenue: float
    room_revenue: float
    fb_revenue: float
    check_ins_count: int
    check_outs_count: int
    closed_by: str
    closed_at: datetime
    
    class Config:
        from_attributes = True
