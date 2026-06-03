from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserInfoResponse(BaseModel):
    id: str
    name: str
    email: str
    kpi_area_id: Optional[int]
    kpi_rol_id: Optional[int]
    area_nombre: Optional[str]
    rol_nombre: Optional[str]

class LoginResponse(BaseModel):
    user: UserInfoResponse
    token: TokenData