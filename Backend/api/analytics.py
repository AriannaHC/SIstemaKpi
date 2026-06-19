# Backend/api/analytics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from calendar import monthrange

from db.database import get_db
from db.models import User, Kpi, KpiProgramado, RegistroKpi, Area
from api.deps import get_current_user
from datetime import timedelta

router = APIRouter(prefix="/api/analytics", tags=["Analítica y Dashboards"])

def _build_month_range(mes: Optional[int], anio: Optional[int]):
    if mes and anio:
        _, ultimo_dia = monthrange(anio, mes)
        inicio = f"{anio}-{mes:02d}-01 00:00:00"
        fin = f"{anio}-{mes:02d}-{ultimo_dia} 23:59:59"
        return inicio, fin
    return None, None

@router.get("/participacion")
def get_tasa_participacion(
    area_id: Optional[int] = None, 
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Calcula el % de cumplimiento de tareas programadas por cada usuario."""
    es_admin = current_user.kpi_rol_id == 1
    
    # Restricción de permisos
    if not es_admin and current_user.kpi_area_id:
        area_id = current_user.kpi_area_id

    inicio, fin = _build_month_range(mes, anio)

    # Base query: Traer Usuarios (solo rol 2 y 3) y sus áreas
    query_users = db.query(User, Area).outerjoin(Area, User.kpi_area_id == Area.id)\
                    .filter(User.kpi_rol_id.in_([2, 3]), User.status == 'active')

    if area_id:
        query_users = query_users.filter(User.kpi_area_id == area_id)

    usuarios = query_users.all()

    resultados = []
    
    for u, a in usuarios:
        q_total = db.query(KpiProgramado).join(Kpi)\
                    .filter(Kpi.responsable_id == u.id)
        q_comp = db.query(KpiProgramado).join(Kpi)\
                   .filter(Kpi.responsable_id == u.id, KpiProgramado.completado == True)

        if inicio and fin:
            q_total = q_total.filter(
                KpiProgramado.fecha_inicio >= inicio,
                KpiProgramado.fecha_fin <= fin
            )
            q_comp = q_comp.filter(
                KpiProgramado.fecha_inicio >= inicio,
                KpiProgramado.fecha_fin <= fin
            )

        total_programados = q_total.count()
        
        if total_programados == 0:
            continue

        completados = q_comp.count()

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
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Retorna el promedio de cumplimiento agrupado por semanas."""
    es_admin = current_user.kpi_rol_id == 1
    
    if not es_admin and current_user.kpi_area_id:
        area_id = current_user.kpi_area_id

    inicio, fin = _build_month_range(mes, anio)

    # Calculamos el promedio de 'cumplimiento' agrupado por 'semana'
    query = db.query(
        RegistroKpi.semana, 
        func.avg(RegistroKpi.cumplimiento).label('promedio_cumplimiento')
    ).join(Kpi).filter(RegistroKpi.cumplimiento != None)

    if inicio and fin:
        query = query.filter(
            RegistroKpi.enviado_en >= inicio,
            RegistroKpi.enviado_en <= fin
        )

    if area_id:
        query = query.filter(Kpi.area_id == area_id)

    # Agrupar por semana y ordenar cronológicamente
    registros = query.group_by(RegistroKpi.semana).order_by(RegistroKpi.semana).all()

    # Formatear salida para Recharts
    resultado = [
        {
            "semana": f"Semana {r.semana}",
            "cumplimiento": round((r.promedio_cumplimiento * 100), 2)
        }
        for r in registros
    ]

    return resultado

@router.get("/comparar-areas")
def comparar_areas(
    area_a: int, 
    area_b: int, 
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Compara las 4 métricas clave entre dos áreas con filtros de fecha."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos.")

    inicio_mes, fin_mes = _build_month_range(mes, anio)

    def obtener_metricas_area(area_id):
        q = db.query(
            func.avg(RegistroKpi.cumplimiento).label('cump'),
            func.avg(RegistroKpi.eficiencia).label('efi'),
            func.avg(RegistroKpi.eficacia).label('efica'),
            func.avg(RegistroKpi.rendimiento).label('rend')
        ).join(Kpi).filter(Kpi.area_id == area_id, RegistroKpi.cumplimiento != None)
        
        if inicio_mes and fin_mes:
            q = q.filter(RegistroKpi.enviado_en >= inicio_mes, RegistroKpi.enviado_en <= fin_mes)
        else:
            if fecha_desde:
                q = q.filter(RegistroKpi.enviado_en >= f"{fecha_desde} 00:00:00")
            if fecha_hasta:
                q = q.filter(RegistroKpi.enviado_en <= f"{fecha_hasta} 23:59:59")
            
        stats = q.first()
        return {
            "cumplimiento": round((stats.cump * 100), 2) if stats.cump else 0.0,
            "eficiencia": round((stats.efi * 100), 2) if stats.efi else 0.0,
            "eficacia": round((stats.efica * 100), 2) if stats.efica else 0.0,
            "rendimiento": round((stats.rend * 100), 2) if stats.rend else 0.0,
        }

    nombre_a = db.query(Area.nombre).filter(Area.id == area_a).scalar() or f"Área {area_a}"
    nombre_b = db.query(Area.nombre).filter(Area.id == area_b).scalar() or f"Área {area_b}"
    stats_a = obtener_metricas_area(area_a)
    stats_b = obtener_metricas_area(area_b)

    return [
        {"metrica": "Cumplimiento", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["cumplimiento"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["cumplimiento"]},
        {"metrica": "Eficiencia", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["eficiencia"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["eficiencia"]},
        {"metrica": "Eficacia", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["eficacia"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["eficacia"]},
        {"metrica": "Rendimiento", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["rendimiento"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["rendimiento"]}
    ]


@router.get("/comparar-trabajadores")
def comparar_trabajadores(
    user_a: str, 
    user_b: str, 
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Compara las 4 métricas clave entre dos trabajadores específicos con filtros de fecha."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos.")

    inicio_mes, fin_mes = _build_month_range(mes, anio)

    def obtener_metricas_usuario(u_id):
        q = db.query(
            func.avg(RegistroKpi.cumplimiento).label('cump'),
            func.avg(RegistroKpi.eficiencia).label('efi'),
            func.avg(RegistroKpi.eficacia).label('efica'),
            func.avg(RegistroKpi.rendimiento).label('rend')
        ).filter(RegistroKpi.usuario_id == u_id, RegistroKpi.cumplimiento != None)
        
        if inicio_mes and fin_mes:
            q = q.filter(RegistroKpi.enviado_en >= inicio_mes, RegistroKpi.enviado_en <= fin_mes)
        else:
            if fecha_desde:
                q = q.filter(RegistroKpi.enviado_en >= f"{fecha_desde} 00:00:00")
            if fecha_hasta:
                q = q.filter(RegistroKpi.enviado_en <= f"{fecha_hasta} 23:59:59")
            
        stats = q.first()
        return {
            "cumplimiento": round((stats.cump * 100), 2) if stats.cump else 0.0,
            "eficiencia": round((stats.efi * 100), 2) if stats.efi else 0.0,
            "eficacia": round((stats.efica * 100), 2) if stats.efica else 0.0,
            "rendimiento": round((stats.rend * 100), 2) if stats.rend else 0.0,
        }

    nombre_a = db.query(User.name).filter(User.id == user_a).scalar() or "Usuario A"
    nombre_b = db.query(User.name).filter(User.id == user_b).scalar() or "Usuario B"
    stats_a = obtener_metricas_usuario(user_a)
    stats_b = obtener_metricas_usuario(user_b)

    return [
        {"metrica": "Cumplimiento", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["cumplimiento"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["cumplimiento"]},
        {"metrica": "Eficiencia", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["eficiencia"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["eficiencia"]},
        {"metrica": "Eficacia", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["eficacia"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["eficacia"]},
        {"metrica": "Rendimiento", "entidadA_nombre": nombre_a, "entidadA_valor": stats_a["rendimiento"], "entidadB_nombre": nombre_b, "entidadB_valor": stats_b["rendimiento"]}
    ]


@router.get("/comparar-meses")
def comparar_meses(
    area_id: Optional[int] = None, 
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Compara Mes Actual vs Mes Anterior. Si se provee mes/anio, compara ese mes vs el anterior."""
    from datetime import datetime
    from calendar import monthrange

    if mes and anio:
        _, ultimo_dia = monthrange(anio, mes)
        curr_inicio = f"{anio}-{mes:02d}-01 00:00:00"
        curr_fin = f"{anio}-{mes:02d}-{ultimo_dia} 23:59:59"
        if mes == 1:
            prev_mes, prev_anio = 12, anio - 1
        else:
            prev_mes, prev_anio = mes - 1, anio
        _, prev_ultimo = monthrange(prev_anio, prev_mes)
        prev_inicio = f"{prev_anio}-{prev_mes:02d}-01 00:00:00"
        prev_fin = f"{prev_anio}-{prev_mes:02d}-{prev_ultimo} 23:59:59"
        curr_label = f"Mes {mes}"
        prev_label = f"Mes {prev_mes}"
    else:
        now = datetime.now()
        curr_inicio = now.replace(day=1, hour=0, minute=0, second=0)
        prev_fin_obj = curr_inicio - timedelta(days=1)
        prev_inicio = prev_fin_obj.replace(day=1, hour=0, minute=0, second=0)
        curr_fin = now
        prev_fin = prev_fin_obj.replace(hour=23, minute=59, second=59)
        curr_label = "Mes Actual"
        prev_label = "Mes Anterior"

    def obtener_stats_mes(inicio, fin):
        q = db.query(
            func.avg(RegistroKpi.cumplimiento).label('cump'),
            func.avg(RegistroKpi.eficiencia).label('efi'),
            func.avg(RegistroKpi.eficacia).label('efica'),
            func.avg(RegistroKpi.rendimiento).label('rend')
        ).filter(RegistroKpi.enviado_en >= inicio, RegistroKpi.enviado_en <= fin, RegistroKpi.cumplimiento != None)
        
        if area_id and area_id > 0:
            q = q.join(Kpi).filter(Kpi.area_id == area_id)
            
        stats = q.first()
        return {
            "cumplimiento": round((stats.cump * 100), 2) if stats.cump else 0.0,
            "eficiencia": round((stats.efi * 100), 2) if stats.efi else 0.0,
            "eficacia": round((stats.efica * 100), 2) if stats.efica else 0.0,
            "rendimiento": round((stats.rend * 100), 2) if stats.rend else 0.0,
        }

    stats_curr = obtener_stats_mes(curr_inicio, curr_fin)
    stats_prev = obtener_stats_mes(prev_inicio, prev_fin)

    return [
        {"metrica": "Cumplimiento", "entidadA_nombre": curr_label, "entidadA_valor": stats_curr["cumplimiento"], "entidadB_nombre": prev_label, "entidadB_valor": stats_prev["cumplimiento"]},
        {"metrica": "Eficiencia", "entidadA_nombre": curr_label, "entidadA_valor": stats_curr["eficiencia"], "entidadB_nombre": prev_label, "entidadB_valor": stats_prev["eficiencia"]},
        {"metrica": "Eficacia", "entidadA_nombre": curr_label, "entidadA_valor": stats_curr["eficacia"], "entidadB_nombre": prev_label, "entidadB_valor": stats_prev["eficacia"]},
        {"metrica": "Rendimiento", "entidadA_nombre": curr_label, "entidadA_valor": stats_curr["rendimiento"], "entidadB_nombre": prev_label, "entidadB_valor": stats_prev["rendimiento"]}
    ]

@router.get("/perfil")
def get_perfil_rendimiento(
    area_id: Optional[int] = None, 
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Devuelve los promedios de las 4 métricas clave a nivel general y por área."""
    inicio, fin = _build_month_range(mes, anio)

    # 1. Promedio General de toda la empresa
    q_gral = db.query(
        func.avg(RegistroKpi.cumplimiento).label('cump'),
        func.avg(RegistroKpi.eficacia).label('efica'),
        func.avg(RegistroKpi.eficiencia).label('efi'),
        func.avg(RegistroKpi.rendimiento).label('rend')
    ).filter(RegistroKpi.cumplimiento != None)

    if inicio and fin:
        q_gral = q_gral.filter(
            RegistroKpi.enviado_en >= inicio,
            RegistroKpi.enviado_en <= fin
        )

    stats_gral = q_gral.first()

    def safe_pct(val):
        return round(float(val) * 100, 1) if val else 0.0

    promedios_gral = [
        safe_pct(stats_gral.cump),
        safe_pct(stats_gral.efica),
        safe_pct(stats_gral.efi),
        safe_pct(stats_gral.rend)
    ]

    # 2. Promedio del Área (si se selecciona una específica)
    promedios_area = []
    if area_id:
        q_area = db.query(
            func.avg(RegistroKpi.cumplimiento).label('cump'),
            func.avg(RegistroKpi.eficacia).label('efica'),
            func.avg(RegistroKpi.eficiencia).label('efi'),
            func.avg(RegistroKpi.rendimiento).label('rend')
        ).join(Kpi).filter(Kpi.area_id == area_id, RegistroKpi.cumplimiento != None)

        if inicio and fin:
            q_area = q_area.filter(
                RegistroKpi.enviado_en >= inicio,
                RegistroKpi.enviado_en <= fin
            )

        stats_area = q_area.first()
        
        if stats_area and stats_area.cump is not None:
            promedios_area = [
                safe_pct(stats_area.cump),
                safe_pct(stats_area.efica),
                safe_pct(stats_area.efi),
                safe_pct(stats_area.rend)
            ]

    return {
        "promedioGral": promedios_gral,
        "areaValor": promedios_area
    }