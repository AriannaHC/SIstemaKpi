# schemas/kpi_schema.py
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class KpiResponse(BaseModel):
    id: int
    nombre: str
    area_id: Optional[int]
    responsable_id: Optional[str]
    responsable_nombre: Optional[str] = None
    meta_valor: float
    activo_semanal: bool
    es_mi_kpi: Optional[bool] = False
    fecha_fin: Optional[datetime] = None
    completado: Optional[bool] = False

    class Config:
        from_attributes = True

class RegistroCreate(BaseModel):
    kpi_id: int
    semana: Optional[int] = None
    periodo_inicio: Optional[str] = None
    periodo_fin: Optional[str] = None
    valores: Dict[str, Any]


class KpiProgramar(BaseModel):
    fecha_inicio: datetime
    fecha_fin: datetime