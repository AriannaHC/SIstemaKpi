# schemas/registro_diario_schema.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# Fila liviana para los paneles de lectura de Operaciones y Calidad.
# Solo trae las columnas que se van a mostrar en la tabla del panel,
# nunca el registro completo (evita saturar la respuesta).
class RegistroDiarioPanelItem(BaseModel):
    id: int
    area_nombre: str
    fecha_registro: datetime
    trabajador_nombre: str
    proceso: str
    tipo_actividad: str
    tipo_tarea: str
    entregable: str
    auditado_operaciones: bool  # <--- AÑADIDO
    auditado_calidad: bool

    class Config:
        orm_mode = True

# Lo que envía el colaborador desde el Frontend (Todo obligatorio)
class RegistroDiarioCreate(BaseModel):
    proceso: str
    tipo_actividad: str
    tipo_tarea: str
    entregable: str
    responsable_asigna: str
    fecha_inicio: datetime
    fecha_entrega: datetime

# Como devolvemos los datos para mostrarlos en la tabla
class RegistroDiarioResponse(BaseModel):
    id: int
    usuario_id: str
    area_id: int
    fecha_registro: datetime

    trabajador_nombre: Optional[str] = None
    area_nombre: Optional[str] = None
    
    proceso: str
    tipo_actividad: str
    tipo_tarea: str
    entregable: str
    responsable_asigna: str
    fecha_inicio: datetime
    fecha_entrega: datetime
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
    auditado_calidad: bool

    # Operaciones
    prioridad: Optional[str]
    tiempo_real_operaciones: Optional[float]
    estado_tarea_operaciones: Optional[str]
    motivo_retraso: Optional[str]
    observaciones_operaciones: Optional[str]
    enlace_evidencia: Optional[str]
    imagen_evidencia: Optional[str] = None
    validacion_lider: Optional[str]
    actitud_colaborador: Optional[str]
    dias_vencimiento: Optional[int]
    auditado_operaciones: bool # <--- AÑADIDO

    class Config:
        orm_mode = True



class RegistroDiarioCalidadUpdate(BaseModel):
    estado_entregable_calidad: str
    estado_animo: str
    tiempo_estandar: float
    tiempo_real_calidad: float
    errores_observaciones: str
    observaciones_calidad: str
    rubrica_final: str
    eficiencia: float
    tasa_calidad: float


class RegistroDiarioOperacionesUpdate(BaseModel):
    prioridad: str
    tiempo_real_operaciones: float
    estado_tarea_operaciones: str
    motivo_retraso: str
    actitud_colaborador: str
    enlace_evidencia: str
    imagen_evidencia: Optional[str] = None
    validacion_lider: str
    observaciones_operaciones: str
    dias_vencimiento: int