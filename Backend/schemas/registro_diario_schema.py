# schemas/registro_diario_schema.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Lo que envía el colaborador desde el Frontend (Todo obligatorio)
class RegistroDiarioCreate(BaseModel):
    proceso: str
    tipo_actividad: str
    entregable: str
    responsable_asigna: str
    fecha_inicio: date
    fecha_entrega: date

# Como devolvemos los datos para mostrarlos en la tabla
class RegistroDiarioResponse(BaseModel):
    id: int
    usuario_id: str
    area_id: int
    fecha_registro: datetime
    
    proceso: str
    tipo_actividad: str
    entregable: str
    responsable_asigna: str
    fecha_inicio: date
    fecha_entrega: date
    unidad_medida: Optional[str] = None
    tiempo_estimado: Optional[float] = None
    estado_base: Optional[str] = None

    # Calidad
    estado_entregable_calidad: Optional[str]
    estado_animo: Optional[str]
    observaciones_calidad: Optional[str]
    tiempo_estandar: Optional[float]
    tiempo_real_calidad: Optional[float]
    errores_observaciones: Optional[str]
    eficiencia: Optional[float]
    tasa_calidad: Optional[float]
    rubrica_final: Optional[str]

    # Operaciones
    prioridad: Optional[str]
    tiempo_real_operaciones: Optional[float]
    estado_tarea_operaciones: Optional[str]
    motivo_retraso: Optional[str]
    observaciones_operaciones: Optional[str]
    enlace_evidencia: Optional[str]
    validacion_lider: Optional[str]
    actitud_colaborador: Optional[str]
    dias_vencimiento: Optional[int]

    class Config:
        orm_mode = True