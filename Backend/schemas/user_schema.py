from pydantic import BaseModel
from typing import Optional

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    kpi_rol_id: Optional[int] = None
    kpi_area_id: Optional[int] = None
    rol_nombre: Optional[str] = None
    area_nombre: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    kpi_rol_id: Optional[int] = None
    kpi_area_id: Optional[int] = None