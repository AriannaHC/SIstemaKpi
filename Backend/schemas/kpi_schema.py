# schemas/kpi_schema.py
from pydantic import BaseModel
from typing import Optional, Dict, Any

class KpiResponse(BaseModel):
    id: int
    nombre: str
    area_id: Optional[int]
    responsable_id: Optional[str]
    meta_valor: float
    activo_semanal: bool
    es_mi_kpi: Optional[bool] = False 

    class Config:
        from_attributes = True

# Actualiza esta clase para aceptar la estructura compleja de tu Mini Excel
class RegistroCreate(BaseModel):
    kpi_id: int
    semana: Optional[int] = None
    periodo_inicio: Optional[str] = None
    periodo_fin: Optional[str] = None
    valores: Dict[str, Any] # Recibe todo el objeto JSON dinámico# schemas/kpi_schema.py
from pydantic import BaseModel
from typing import Optional, Dict, Any

class KpiResponse(BaseModel):
    id: int
    nombre: str
    area_id: Optional[int]
    responsable_id: Optional[str]
    meta_valor: float
    activo_semanal: bool
    es_mi_kpi: Optional[bool] = False 

    class Config:
        from_attributes = True

# Actualiza esta clase para aceptar la estructura compleja de tu Mini Excel
class RegistroCreate(BaseModel):
    kpi_id: int
    semana: Optional[int] = None
    periodo_inicio: Optional[str] = None
    periodo_fin: Optional[str] = None
    valores: Dict[str, Any] # Recibe todo el objeto JSON dinámico