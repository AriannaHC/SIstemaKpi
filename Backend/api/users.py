from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from db.models import User, Area, KpiRol
from schemas.user_schema import UserResponse, UserUpdate
from api.deps import get_current_user

router = APIRouter(prefix="/api/users", tags=["Gestión de Usuarios"])


def _serialize_user(u: User) -> dict:
    """
    Convierte un objeto ORM User a dict listo para UserResponse.
    Resuelve area_nombre y rol_nombre desde las relaciones cargadas.
    """
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "kpi_rol_id": u.kpi_rol_id,
        "kpi_area_id": u.kpi_area_id,
        "rol_nombre": u.rol_kpi.nombre if u.rol_kpi else None,
        "area_nombre": u.area_kpi.nombre if u.area_kpi else None,
    }


@router.get("/", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene todos los usuarios activos. Solo Administrador (rol 1)."""
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver usuarios")

    users = db.query(User).filter(User.status == True).order_by(User.name).all()
    return [_serialize_user(u) for u in users]


@router.get("/mi-equipo", response_model=List[UserResponse])
def get_mi_equipo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve los trabajadores (rol 3) del área del Jefe de Área autenticado.
    Solo accesible por Jefe de Área (rol 2). El Admin usa /api/users/ en su lugar.
    """
    if current_user.kpi_rol_id != 2:
        raise HTTPException(status_code=403, detail="Solo el Jefe de Área puede acceder a este endpoint")

    if not current_user.kpi_area_id:
        raise HTTPException(status_code=400, detail="No tienes un área asignada")

    # Devuelve TODOS los miembros activos del área sin excepción,
    # incluido el propio jefe de área. Sin filtro por rol.
    users = (
        db.query(User)
        .filter(
            User.status == True,
            User.kpi_area_id == current_user.kpi_area_id,
        )
        .order_by(User.name)
        .all()
    )
    return [_serialize_user(u) for u in users]


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza el rol y área de KPI de un trabajador. Solo Administrador."""
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar usuarios")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Si se quita el rol (None), también se quita el área
    if payload.kpi_rol_id is None:
        user.kpi_rol_id = None
        user.kpi_area_id = None
    else:
        user.kpi_rol_id = payload.kpi_rol_id
        # Admin (rol 1) no necesita área asignada
        if payload.kpi_rol_id == 1:
            user.kpi_area_id = None
        else:
            user.kpi_area_id = payload.kpi_area_id

    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve los roles disponibles para poblar el <select> de la UI."""
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Sin permisos")
    roles = db.query(KpiRol).order_by(KpiRol.id).all()
    return [{"id": r.id, "nombre": r.nombre} for r in roles]