# api/registro_diario.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from db.database import get_db
from db.models import User, RegistroDiario
from schemas.registro_diario_schema import RegistroDiarioCreate, RegistroDiarioResponse
from api.deps import get_current_user

router = APIRouter(prefix="/api/registros-diarios", tags=["Registros Diarios"])

@router.post("/", response_model=RegistroDiarioResponse)
def crear_registro(
    registro_in: RegistroDiarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verificación de seguridad básica
    if not current_user.kpi_area_id:
        raise HTTPException(status_code=400, detail="El usuario no tiene un área asignada.")

    # Inyección de campos automáticos
    nuevo_registro = RegistroDiario(
        usuario_id=current_user.id,
        area_id=current_user.kpi_area_id,
        fecha_registro=datetime.utcnow(),
        # Expansión de los datos obligatorios del usuario
        **registro_in.dict()
    )
    
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    
    return nuevo_registro