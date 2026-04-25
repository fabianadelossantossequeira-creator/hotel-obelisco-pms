import os
import re
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Leer la variable de entorno DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # SQLAlchemy 1.4+ requiere 'postgresql://', no 'postgres://'
    # Esta función corrige la URL automáticamente
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    # Solo para desarrollo local, usa SQLite
    DATABASE_URL = "sqlite:///./test.db"

print(f"Conectando a la base de datos...")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
