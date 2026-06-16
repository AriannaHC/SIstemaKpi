# Backend/api/analytics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from db.database import get_db
from db.models import User, Kpi, KpiProgramado, RegistroKpi, Area
from api.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analítica y Dashboards"])

@router.get("/participacion")
def get_tasa_participacion(
    area_id: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Calcula el % de cumplimiento de tareas programadas por cada usuario."""
    es_admin = current_user.kpi_rol_id == 1
    
    # Restricción de permisos
    if not es_admin and current_user.kpi_area_id:
        area_id = current_user.kpi_area_id

    # Base query: Traer Usuarios (solo rol 2 y 3) y sus áreas
    query_users = db.query(User, Area).outerjoin(Area, User.kpi_area_id == Area.id)\
                    .filter(User.kpi_rol_id.in_([2, 3]), User.status == 'active')

    if area_id:
        query_users = query_users.filter(User.kpi_area_id == area_id)

    usuarios = query_users.all()

    resultados = []
    
    for u, a in usuarios:
        # Contar total de KPIs programados asignados a este usuario
        total_programados = db.query(KpiProgramado).join(Kpi)\
                              .filter(Kpi.responsable_id == u.id).count()
        
        if total_programados == 0:
            continue # Si no tiene KPIs, no entra al ranking

        completados = db.query(KpiProgramado).join(Kpi)\
                        .filter(Kpi.responsable_id == u.id, KpiProgramado.completado == True).count()

        porcentaje = round((completados / total_programados) * 100, 1)

        resultados.append({
            "id": u.id,
            "nombre": u.name,
            "area": a.nombre if a else "Sin Área",
            "score": porcentaje,
            "alerta_cero": porcentaje == 0,
            "alerta_alta": porcentaje >= 90
        })

    # Ordenar de mayor a menor score por defecto
    resultados = sorted(resultados, key=lambda x: x['score'], reverse=True)
    return resultados


@router.get("/evolucion")
def get_evolucion_historica(
    area_id: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Retorna el promedio de cumplimiento agrupado por semanas."""
    es_admin = current_user.kpi_rol_id == 1
    
    if not es_admin and current_user.kpi_area_id:
        area_id = current_user.kpi_area_id

    # Calculamos el promedio de 'cumplimiento' agrupado por 'semana'
    query = db.query(
        RegistroKpi.semana, 
        func.avg(RegistroKpi.cumplimiento).label('promedio_cumplimiento')
    ).join(Kpi).filter(RegistroKpi.cumplimiento != None)

    if area_id:
        query = query.filter(Kpi.area_id == area_id)

    # Agrupar por semana y ordenar cronológicamente
    registros = query.group_by(RegistroKpi.semana).order_by(RegistroKpi.semana).all()

    # Formatear salida para Recharts
    resultado = [
        {
            "semana": f"Semana {r.semana}",
            "cumplimiento": round((r.promedio_cumplimiento * 100), 2) # Multiplicar por 100 si viene como 0.85
        }
        for r in registros
    ]

    return resultado


# Agrégalo al final de Backend/api/analytics.py

@router.get("/comparar-areas")
def comparar_areas(
    area_a: int, 
    area_b: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Compara el rendimiento promedio (cumplimiento) entre dos áreas."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos.")

    # Obtenemos los promedios de cumplimiento de todos los registros de esas áreas
    def obtener_promedio_area(area_id):
        promedio = db.query(func.avg(RegistroKpi.cumplimiento))\
                     .join(Kpi, RegistroKpi.kpi_id == Kpi.id)\
                     .filter(Kpi.area_id == area_id, RegistroKpi.cumplimiento != None)\
                     .scalar()
        return round((promedio * 100), 2) if promedio else 0.0

    nombre_a = db.query(Area.nombre).filter(Area.id == area_a).scalar() or f"Área {area_a}"
    nombre_b = db.query(Area.nombre).filter(Area.id == area_b).scalar() or f"Área {area_b}"

    return [
        {
            "metrica": "Cumplimiento Promedio",
            "entidadA_nombre": nombre_a,
            "entidadA_valor": obtener_promedio_area(area_a),
            "entidadB_nombre": nombre_b,
            "entidadB_valor": obtener_promedio_area(area_b),
        }
    ]


@router.get("/comparar-trabajadores")
def comparar_trabajadores(
    user_a: str, 
    user_b: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Compara métricas entre dos trabajadores específicos."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos.")

    def obtener_metricas_usuario(u_id):
        # Promedio de Cumplimiento, Eficiencia, Eficacia
        stats = db.query(
            func.avg(RegistroKpi.cumplimiento).label('cump'),
            func.avg(RegistroKpi.eficiencia).label('efi'),
            func.avg(RegistroKpi.eficacia).label('efica')
        ).filter(RegistroKpi.usuario_id == u_id).first()
        
        return {
            "cumplimiento": round((stats.cump * 100), 2) if stats.cump else 0.0,
            "eficiencia": round((stats.efi * 100), 2) if stats.efi else 0.0,
            "eficacia": round((stats.efica * 100), 2) if stats.efica else 0.0,
        }

    nombre_a = db.query(User.name).filter(User.id == user_a).scalar() or "Usuario A"
    nombre_b = db.query(User.name).filter(User.id == user_b).scalar() or "Usuario B"

    stats_a = obtener_metricas_usuario(user_a)
    stats_b = obtener_metricas_usuario(user_b)

    return [
        {
            "metrica": "Cumplimiento (%)",
            "entidadA_nombre": nombre_a,
            "entidadA_valor": stats_a["cumplimiento"],
            "entidadB_nombre": nombre_b,
            "entidadB_valor": stats_b["cumplimiento"]
        },
        {
            "metrica": "Eficiencia (%)",
            "entidadA_nombre": nombre_a,
            "entidadA_valor": stats_a["eficiencia"],
            "entidadB_nombre": nombre_b,
            "entidadB_valor": stats_b["eficiencia"]
        },
        {
            "metrica": "Eficacia (%)",
            "entidadA_nombre": nombre_a,
            "entidadA_valor": stats_a["eficacia"],
            "entidadB_nombre": nombre_b,
            "entidadB_valor": stats_b["eficacia"]
        }
    ]