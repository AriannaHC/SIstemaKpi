from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from db.database import Base
import uuid


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

class KpiProgramado(Base):
    __tablename__ = "kpis_programados"
    id = Column(Integer, primary_key=True, index=True)
    kpi_id = Column(Integer, ForeignKey("kpis.id", ondelete="CASCADE"), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    completado = Column(Boolean, default=False)
    registro_kpi_id = Column(Integer, ForeignKey("registros_kpi.id", ondelete="SET NULL"), nullable=True)
    asignado_por = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

    kpi = relationship("Kpi")
    asignador = relationship("User", foreign_keys=[asignado_por])


class Notification(Base):
    __tablename__ = "notifications"
    # El id es un varchar(36), usaremos uuid4 para generarlo automáticamente
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    body = Column(String(500), nullable=True) # Lo tratamos como string largo
    image_url = Column(String(500), nullable=True)
    pdf_url = Column(String(500), nullable=True)
    audience = Column(String(50), default='all')
    audience_value = Column(String(150), nullable=True)
    created_by = Column(String(36), nullable=False)
    idempotency_key = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NotificationRead(Base):
    __tablename__ = "notification_reads"
    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(String(36), nullable=False)
    user_id = Column(String(36), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)

class RegistroDiario(Base):
    __tablename__ = "registro_diario_actividades"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # --- DATOS BASE AUTOMÁTICOS ---
    usuario_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    # --- DATOS BASE DEL COLABORADOR (NOT NULL) ---
    proceso = Column(String(200), nullable=False)
    tipo_actividad = Column(String(150), nullable=False) 
    tipo_tarea = Column(String(150), nullable=False) # <--- AÑADIDO
    entregable = Column(String(300), nullable=False)
    responsable_asigna = Column(String(150), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_entrega = Column(DateTime, nullable=False)
    unidad_medida = Column(String(50), nullable=False) # "Horas" o "Días"
    tiempo_estimado = Column(Float, nullable=False)
    estado_base = Column(String(100), nullable=False) # ej. "En proceso", "Terminado"

    # --- DATOS EXCLUSIVOS: CONTROL DE CALIDAD (NULLABLE) ---
    estado_entregable_calidad = Column(String(100), nullable=True)
    estado_animo = Column(String(100), nullable=True)
    observaciones_calidad = Column(String(500), nullable=True)
    tiempo_estandar = Column(Float, nullable=True)
    tiempo_real_calidad = Column(Float, nullable=True)
    errores_observaciones = Column(String(500), nullable=True)
    eficiencia = Column(Float, nullable=True)
    tasa_calidad = Column(Float, nullable=True)
    rubrica_final = Column(String(500), nullable=True)
    auditado_calidad = Column(Boolean, default=False, nullable=False)

    # --- DATOS EXCLUSIVOS: OPERACIONES (NULLABLE) ---
    prioridad = Column(String(50), nullable=True)
    tiempo_real_operaciones = Column(Float, nullable=True)
    estado_tarea_operaciones = Column(String(100), nullable=True)
    motivo_retraso = Column(String(500), nullable=True)
    observaciones_operaciones = Column(String(500), nullable=True)
    enlace_evidencia = Column(String(500), nullable=True)
    imagen_evidencia = Column(String(500), nullable=True)
    validacion_lider = Column(String(100), nullable=True)
    actitud_colaborador = Column(String(100), nullable=True)
    dias_vencimiento = Column(Integer, nullable=True)
    auditado_operaciones = Column(Boolean, default=False, nullable=False)
    
    # Relaciones para facilitar las consultas
    usuario = relationship("User", foreign_keys=[usuario_id])
    area = relationship("Area", foreign_keys=[area_id])