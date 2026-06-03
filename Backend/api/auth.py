from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User
from schemas.auth_schema import LoginRequest, LoginResponse, UserInfoResponse, TokenData
from core.security import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Buscar usuario
    user = db.query(User).filter(User.email == request.email).first()
    
    # 2. Validar existencia, contraseña y estado
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    
    if not user.status:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    
    if not user.kpi_rol_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso al sistema de KPIs")

    # 3. Crear Token
    token_data = {"sub": str(user.id), "rol": user.kpi_rol_id, "area": user.kpi_area_id}
    access_token = create_access_token(data=token_data)

    # 4. Formatear la respuesta
    user_info = UserInfoResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        kpi_area_id=user.kpi_area_id,
        kpi_rol_id=user.kpi_rol_id,
        area_nombre=user.area_kpi.nombre if user.area_kpi else None,
        rol_nombre=user.rol_kpi.nombre if user.rol_kpi else None
    )

    return LoginResponse(
        user=user_info,
        token=TokenData(access_token=access_token)
    )