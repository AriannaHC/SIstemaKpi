from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from db.database import Base

class Area(Base):
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    activo = Column(Boolean, default=True)

    usuarios = relationship("User", back_populates="area_kpi", foreign_keys="User.kpi_area_id")

class KpiRol(Base):
    __tablename__ = "kpi_roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    
    usuarios = relationship("User", back_populates="rol_kpi", foreign_keys="User.kpi_rol_id")

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column("password_hash", String(255), nullable=False)
    status = Column(Boolean, default=True)
    
    # Llaves foráneas para el sistema de KPIs
    kpi_area_id = Column(Integer, ForeignKey("areas.id"), nullable=True)
    kpi_rol_id = Column(Integer, ForeignKey("kpi_roles.id"), nullable=True)

    area_kpi = relationship("Area", back_populates="usuarios", foreign_keys=[kpi_area_id])
    rol_kpi = relationship("KpiRol", back_populates="usuarios", foreign_keys=[kpi_rol_id])