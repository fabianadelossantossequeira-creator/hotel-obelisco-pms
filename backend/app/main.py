from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base

# Importar todos los modelos
from .models import (
    Room, Folio, Charge, Reservation, 
    MenuCategory, MenuItem, MinibarItem, DailyClosure
)

# Importar todos los routers
from .routers import (
    rooms, reservations, folios, pos, 
    housekeeping, channel_manager, closure
)

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="🏨 PMS Hotel Obelisco - Salto, Uruguay",
    description="""
    ## Sistema de Gestión Hotelera Completo
    
    ### Módulos incluidos:
    - **Habitaciones**: Gestión de disponibilidad y estados
    - **Reservas**: Código único, datos completos del huésped
    - **Check-in/Check-out**: Ficha de registro, facturación con IVA
    - **Restaurante/Bar**: Menú completo, carga a habitación
    - **Housekeeping**: Gestión de limpieza y minibar
    - **Channel Manager**: Conexión con OTAs (Booking/Expedia)
    - **Cierre del Día**: Auditoría nocturna, cuadre de caja
    
    ### Desarrollado para Hotel Obelisco - Salto, Uruguay
    """,
    version="2.0.0"
)

# Configurar CORS para permitir conexiones desde cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir todos los routers
app.include_router(rooms.router)
app.include_router(reservations.router)
app.include_router(folios.router)
app.include_router(pos.router)
app.include_router(housekeeping.router)
app.include_router(channel_manager.router)
app.include_router(closure.router)

@app.get("/")
async def root():
    return {
        "mensaje": "🏨 Bienvenido al PMS del Hotel Obelisco - Salto, Uruguay",
        "version": "2.0.0",
        "documentacion": "/docs",
        "endpoints": {
            "habitaciones": "/rooms",
            "reservas": "/reservations",
            "check_in_out": "/folios",
            "restaurante": "/pos",
            "housekeeping": "/housekeeping",
            "channel_manager": "/channel-manager",
            "cierre_dia": "/closure"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "online", "service": "PMS Hotel Obelisco"}
