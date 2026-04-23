from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, DateTime, ForeignKey, Date, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class RoomStatus(str, enum.Enum):
    CLEAN = "clean"
    DIRTY = "dirty"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    OUT_OF_ORDER = "out_of_order"

class ReservationSource(str, enum.Enum):
    DIRECT = "direct"
    BOOKING_COM = "booking_com"
    EXPEDIA = "expedia"
    PHONE = "phone"
    EMAIL = "email"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    TRANSFER = "transfer"

class BreakfastType(str, enum.Enum):
    NONE = "none"
    CONTINENTAL = "continental"
    AMERICAN = "american"
    BUFFET = "buffet"

class ChargeType(str, enum.Enum):
    ROOM = "room"
    RESTAURANT = "restaurant"
    BAR = "bar"
    MINIBAR = "minibar"
    LAUNDRY = "laundry"
    SPA = "spa"
    EXTRA_BED = "extra_bed"
    BREAKFAST = "breakfast"

class IVAType(str, enum.Enum):
    IVA_10 = "10"
    IVA_22 = "22"
    EXENTO = "0"

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    room_number = Column(String(10), unique=True, nullable=False)
    room_type = Column(String(50), nullable=False)
    base_price = Column(Float, nullable=False)
    status = Column(Enum(RoomStatus), default=RoomStatus.CLEAN)
    max_guests = Column(Integer, default=2)
    description = Column(Text)
    image_url = Column(String(500))
    floor = Column(String(10))
    
    folios = relationship("Folio", back_populates="room")
    reservations = relationship("Reservation", back_populates="room")
    minibar_items = relationship("MinibarItem", back_populates="room")

class Folio(Base):
    __tablename__ = "folios"
    id = Column(Integer, primary_key=True)
    guest_name = Column(String(100), nullable=False)
    guest_email = Column(String(100))
    guest_phone = Column(String(20))
    guest_document = Column(String(20))
    guest_nationality = Column(String(50))
    guest_address = Column(Text)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    check_in = Column(DateTime, nullable=False)
    check_out = Column(DateTime)
    adults_count = Column(Integer, default=1)
    children_count = Column(Integer, default=0)
    total_charges = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    iva_10 = Column(Float, default=0.0)
    iva_22 = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    payment_method = Column(Enum(PaymentMethod))
    created_at = Column(DateTime, server_default=func.now())
    
    room = relationship("Room", back_populates="folios")
    charges = relationship("Charge", back_populates="folio")

class Charge(Base):
    __tablename__ = "charges"
    id = Column(Integer, primary_key=True)
    folio_id = Column(Integer, ForeignKey("folios.id"))
    amount = Column(Float, nullable=False)
    description = Column(String(200), nullable=False)
    charge_type = Column(Enum(ChargeType), nullable=False)
    iva_type = Column(Enum(IVAType), default=IVAType.IVA_22)
    created_at = Column(DateTime, server_default=func.now())
    
    folio = relationship("Folio", back_populates="charges")

class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(Integer, primary_key=True)
    reservation_code = Column(String(20), unique=True, nullable=False)
    guest_name = Column(String(100), nullable=False)
    guest_email = Column(String(100))
    guest_phone = Column(String(20))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    adults_count = Column(Integer, default=1)
    children_count = Column(Integer, default=0)
    children_ages = Column(JSON)
    total_price = Column(Float, nullable=False)
    source = Column(Enum(ReservationSource), default=ReservationSource.DIRECT)
    external_id = Column(String(50))
    special_requests = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    
    room = relationship("Room", back_populates="reservations")

class MenuCategory(Base):
    __tablename__ = "menu_categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("menu_categories.id"))
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    iva_type = Column(Enum(IVAType), default=IVAType.IVA_22)
    is_available = Column(Boolean, default=True)
    meal_period = Column(String(20))

# ============================================
# TABLA: Minibar
# ============================================
class MinibarItem(Base):
    __tablename__ = "minibar_items"
    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    folio_id = Column(Integer, ForeignKey("folios.id"))
    item_name = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    charged = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    room = relationship("Room", back_populates="minibar_items")

# ============================================
# TABLA: Cierre del Día
# ============================================
class DailyClosure(Base):
    __tablename__ = "daily_closures"
    id = Column(Integer, primary_key=True)
    closure_date = Column(Date, nullable=False)
    initial_cash = Column(Float, default=0.0)
    cash_received = Column(Float, default=0.0)
    cash_paid_out = Column(Float, default=0.0)
    actual_cash_counted = Column(Float, default=0.0)
    difference = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)
    room_revenue = Column(Float, default=0.0)
    fb_revenue = Column(Float, default=0.0)
    other_revenue = Column(Float, default=0.0)
    occupancy_rate = Column(Float, default=0.0)
    adr = Column(Float, default=0.0)
    revpar = Column(Float, default=0.0)
    check_ins_count = Column(Integer, default=0)
    check_outs_count = Column(Integer, default=0)
    no_shows_count = Column(Integer, default=0)
    closed_by = Column(String(50))
    closed_at = Column(DateTime, server_default=func.now())
