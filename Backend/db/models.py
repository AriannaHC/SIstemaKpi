from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, ForeignKey, BigInteger
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


# db/models.py (Añade/Reemplaza desde la clase Kpi hacia abajo)

class Kpi(Base):
    __tablename__ = "kpis"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    
    formula_texto = Column(String(500), nullable=True) 
    tipo_kpi = Column(String(50), default="Positivo")

    area_id = Column(Integer, ForeignKey("areas.id"), nullable=True)
    responsable_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    meta_valor = Column(Float, default=0.0)
    meta_produccion = Column(Float, nullable=True)
    horas_planificadas = Column(Float, nullable=True)
    activo = Column(Boolean, default=True) 
    activo_semanal = Column(Boolean, default=False)
    
    area = relationship("Area")
    responsable = relationship("User", foreign_keys=[responsable_id])

class KpiCampo(Base):
    __tablename__ = "kpi_campos"
    id = Column(Integer, primary_key=True, index=True)
    kpi_id = Column(Integer, ForeignKey("kpis.id"), nullable=False)
    campo_key = Column(String(100), nullable=False)
    campo_label = Column(String(200), nullable=False)
    tipo = Column(String(50), default="numero")
    origen = Column(String(50), default="usuario") # Faltaba
    formula_personalizada = Column(String(500), nullable=True) # Faltaba
    es_requerido = Column(Boolean, default=False)
    orden = Column(Integer, default=0) # Faltaba

class RegistroKpi(Base):
    __tablename__ = "registros_kpi"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    kpi_id = Column(Integer, ForeignKey("kpis.id"), nullable=False)
    periodo_inicio = Column(String(20), nullable=True)
    periodo_fin = Column(String(20), nullable=True)
    semana = Column(Integer, nullable=True)
    estado = Column(String(50), default='enviado')
    valor_semanal = Column(Float, nullable=True)
    cumplimiento = Column(Float, nullable=True)
    productividad = Column(Float, nullable=True)
    eficiencia = Column(Float, nullable=True)
    eficacia = Column(Float, nullable=True)
    efectividad = Column(Float, nullable=True)
    rendimiento = Column(Float, nullable=True)
    alerta = Column(String(20), default='gris')
    observaciones = Column(String(500), nullable=True)
    acciones_correctivas = Column(String(500), nullable=True)
    enviado_en = Column(DateTime, default=datetime.utcnow)

class RegistroValores(Base):
    __tablename__ = "registro_valores"
    id = Column(Integer, primary_key=True, index=True)
    registro_id = Column(Integer, ForeignKey("registros_kpi.id"), nullable=False)
    campo_id = Column(Integer, ForeignKey("kpi_campos.id"), nullable=False)
    valor = Column(Float, nullable=True)