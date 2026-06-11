import os, re
import openpyxl
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models import User, Kpi, RegistroKpi, KpiCampo, RegistroValores, Area, KpiProgramado
from schemas.kpi_schema import KpiResponse, RegistroCreate, KpiProgramar
from api.deps import get_current_user

router = APIRouter(prefix="/api/kpis", tags=["Gestión de KPIs"])

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
#  UTILIDADES (sin cambios)
# ══════════════════════════════════════════════════════════════════════════════

def _safe_float(val):
    try:
        return float(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def _campo_key(label: str) -> str:
    return re.sub(r"[^a-z0-9_]", "_", label.lower())[:80]


def is_system_col(h: str) -> bool:
    h_lower = h.lower().strip()
    exact_matches = {
        "semana", "cuartil", "fecha inicio", "fecha fin", "duración (días)",
        "kpi", "fórmula base", "objetivo", "función", "importancia", "responsable",
    }
    return h_lower in exact_matches


def build_js_formula(formula_text, campos_entrada):
    if not formula_text or str(formula_text).strip().lower() == "nan":
        return ""
    form = str(formula_text)
    form = re.sub(r"(?i)(?:\*|x|×)\s*100\b", "", form).strip()
    form = form.replace("×", "*").replace("x", "*").replace("÷", "/").replace("−", "-")
    campos_validos = [
        c for c in campos_entrada
        if c.lower() not in ["observaciones", "acciones correctivas"]
    ]
    campos_validos.sort(key=len, reverse=True)
    for c in campos_validos:
        form = form.replace(c, f"[{c}]")
    return form


def _extract_kpi_fields_from_sheet(ws) -> dict:
    rows = list(ws.iter_rows(min_row=4, max_row=5, values_only=True))
    if len(rows) < 2:
        return {}
    headers = [str(v).strip() if v is not None else "" for v in rows[0]]
    data = rows[1]

    def get_val(col_name):
        try:
            idx = headers.index(col_name)
            v = data[idx] if idx < len(data) else None
            return None if v is None or str(v).strip() == "nan" else v
        except ValueError:
            return None

    kpi_name = get_val("KPI")
    if not kpi_name or str(kpi_name).strip() in ("nan", ""):
        kpi_name = None

    formula = get_val("Fórmula base") or ""
    meta_raw = (
        get_val("Meta KPI <=") or get_val("Meta KPI >=")
        or get_val("Meta KPI ≤") or get_val("Meta KPI ≥")
    )
    meta_tipo = "minimo"
    for h in headers:
        if "Meta KPI <" in h or "Meta KPI ≤" in h:
            meta_tipo = "maximo"
            break

    meta_prod_raw = (
        get_val("Meta Producción <=") or get_val("Meta Producción >=")
        or get_val("Meta Producción ≤") or get_val("Meta Producción ≥")
    )
    horas_plan_raw = get_val("Horas planificadas")

    input_fields, seen = [], set()
    for h in headers:
        h_clean = h.strip()
        if h_clean and not is_system_col(h_clean) and h_clean not in seen:
            input_fields.append(h_clean)
            seen.add(h_clean)

    return {
        "kpi_name": str(kpi_name) if kpi_name else None,
        "formula": str(formula),
        "meta_valor": _safe_float(meta_raw),
        "meta_tipo": meta_tipo,
        "meta_prod": _safe_float(meta_prod_raw),
        "horas_plan": _safe_float(horas_plan_raw),
        "input_fields": input_fields,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  1. ESTRUCTURA DINÁMICA — selects encadenados Area → KPI → Campos
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/areas")
def get_areas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    es_admin = current_user.kpi_rol_id == 1
    if es_admin:
        areas = db.query(Area).filter(Area.activo == True).order_by(Area.nombre).all()
    else:
        if not current_user.kpi_area_id:
            return []
        areas = (
            db.query(Area)
            .filter(Area.id == current_user.kpi_area_id, Area.activo == True)
            .all()
        )
    return [{"id": a.id, "nombre": a.nombre} for a in areas]


@router.get("/area/{area_id:int}")
def get_kpis_por_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    es_admin = current_user.kpi_rol_id == 1
    if not es_admin and current_user.kpi_area_id != area_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta área.")

    kpis = (
        db.query(Kpi)
        .filter(Kpi.area_id == area_id, Kpi.activo == True)
        .order_by(Kpi.nombre)
        .all()
    )
    return [{"id": k.id, "nombre": k.nombre, "formula_texto": k.formula_texto} for k in kpis]


@router.get("/campos/{kpi_id:int}")
def get_campos_kpi(kpi_id: int, db: Session = Depends(get_db)):
    campos = (
        db.query(KpiCampo)
        .filter(KpiCampo.kpi_id == kpi_id)
        .order_by(KpiCampo.orden)
        .all()
    )
    kpi = db.query(Kpi).filter(Kpi.id == kpi_id).first()

    kpi_meta = None
    if kpi:
        kpi_meta = {
            "meta_valor": kpi.meta_valor,
            "meta_produccion": getattr(kpi, "meta_produccion", None),
            "horas_planificadas": getattr(kpi, "horas_planificadas", None),
        }

    campos_serializados = [
        {
            "id": c.id,
            "kpi_id": c.kpi_id,
            "campo_key": c.campo_key,
            "campo_label": c.campo_label,
            "tipo": c.tipo,
            "origen": c.origen,
            "formula_personalizada": c.formula_personalizada or "",
            "es_requerido": c.es_requerido,
            "orden": c.orden,
        }
        for c in campos
    ]

    return {"campos": campos_serializados, "kpi_meta": kpi_meta}


# ══════════════════════════════════════════════════════════════════════════════
#  2. CONFIGURACIÓN DEL MINI EXCEL
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/configuracion/{kpi_id:int}")
def get_configuracion(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Solo el Administrador (rol 1) puede ver la configuración de KPIs
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede ver la configuración de KPIs.")

    campos = (
        db.query(KpiCampo)
        .filter(KpiCampo.kpi_id == kpi_id)
        .order_by(KpiCampo.orden)
        .all()
    )
    kpi = db.query(Kpi).filter(Kpi.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI no encontrado.")

    return {
        "formula_original": kpi.formula_texto or "",
        "campos": [
            {
                "id": c.id,
                "campo_key": c.campo_key,
                "campo_label": c.campo_label,
                "tipo": c.tipo,
                "origen": c.origen,
                "formula_personalizada": c.formula_personalizada or "",
            }
            for c in campos
        ],
    }


@router.post("/configuracion/{kpi_id:int}")
def save_configuracion(
    kpi_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Solo el Administrador (rol 1) puede guardar configuración de KPIs
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede configurar KPIs.")

    campos_payload = payload.get("campos", [])
    for c in campos_payload:
        campo = (
            db.query(KpiCampo)
            .filter(KpiCampo.id == c["id"], KpiCampo.kpi_id == kpi_id)
            .first()
        )
        if campo:
            campo.origen = c.get("origen", campo.origen)
            campo.formula_personalizada = c.get("formula_personalizada") or None

    try:
        db.commit()
        return {"success": True, "message": "Configuración guardada exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  3. DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard_data")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    es_admin = current_user.kpi_rol_id == 1

    if es_admin:
        areas = db.query(Area).filter(Area.activo == True).order_by(Area.nombre).all()
    else:
        if not current_user.kpi_area_id:
            return []
        areas = (
            db.query(Area)
            .filter(Area.id == current_user.kpi_area_id, Area.activo == True)
            .all()
        )

    result = []
    for area in areas:
        kpis = (
            db.query(Kpi)
            .filter(Kpi.area_id == area.id)
            .order_by(Kpi.id)
            .all()
        )
        result.append(
            {
                "id": area.id,
                "nombre": area.nombre,
                "kpis": [
                    {
                        "id": k.id,
                        "nombre": k.nombre,
                        "formula_texto": k.formula_texto or "N/A",
                        "tipo_kpi": getattr(k, "tipo_kpi", "Positivo") or "Positivo",
                        "activo_semanal": k.activo_semanal,
                    }
                    for k in kpis
                ],
            }
        )
    return result


# ══════════════════════════════════════════════════════════════════════════════
#  3b. NUEVO — KPIs semanales por área (para el panel de gestión semanal)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/semanales/{area_id:int}")
def get_kpis_semanales_por_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos para gestionar KPIs semanales.")

    if current_user.kpi_rol_id == 2 and current_user.kpi_area_id != area_id:
        raise HTTPException(status_code=403, detail="Solo puedes gestionar tu propia área.")

    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada.")

    kpis = db.query(Kpi).filter(Kpi.area_id == area_id, Kpi.activo == True).order_by(Kpi.nombre).all()

    now = datetime.now()
    
    # Buscar programaciones activas (vigentes hoy y no completadas)
    programaciones = db.query(KpiProgramado).join(Kpi).filter(
        Kpi.area_id == area_id,
        KpiProgramado.fecha_inicio <= now,
        KpiProgramado.fecha_fin >= now,
    ).all()

    # Diccionario para saber rápidamente qué KPIs están programados
    prog_dict = {p.kpi_id: p for p in programaciones}

    return {
        "area_id": area.id,
        "area_nombre": area.nombre,
        "activos_count": len(programaciones),
        "max_activos": 3,
        "kpis": [
            {
                "id": k.id,
                "nombre": k.nombre,
                "formula_texto": k.formula_texto or "",
                "is_programado": k.id in prog_dict,
                "fecha_fin": prog_dict[k.id].fecha_fin if k.id in prog_dict else None,
                "responsable_id": k.responsable_id,
                "completado": prog_dict[k.id].completado if k.id in prog_dict else False,
            }
            for k in kpis
        ],
    }

# ══════════════════════════════════════════════════════════════════════════════
#  4. OPERACIÓN DIARIA
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/diario", response_model=List[KpiResponse])
def obtener_kpis_diarios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    es_admin = current_user.kpi_rol_id == 1
    now = datetime.now()

    # Buscamos en auditoría: los que están en fecha y NO están completados
    query = db.query(KpiProgramado).join(Kpi).filter(
        KpiProgramado.fecha_inicio <= now,
        KpiProgramado.fecha_fin >= now,
    )

    if not es_admin:
        if not current_user.kpi_area_id:
            return []
        query = query.filter(Kpi.area_id == current_user.kpi_area_id)

    programados = query.all()

    # Formateamos la respuesta extrayendo el KPI de la auditoría
    resultado = [
        KpiResponse(
            id=p.kpi.id,
            nombre=p.kpi.nombre,
            area_id=p.kpi.area_id,
            responsable_id=p.kpi.responsable_id,
            responsable_nombre=p.kpi.responsable.name if p.kpi.responsable else None,
            meta_valor=p.kpi.meta_valor or 0.0,
            activo_semanal=True,
            es_mi_kpi=(p.kpi.responsable_id == current_user.id),
            fecha_fin=p.fecha_fin,
            completado=p.completado
        )
        for p in programados
    ]
    return sorted(resultado, key=lambda k: k.es_mi_kpi, reverse=True)

@router.post("/{kpi_id}/programar")
def programar_kpi_semanal(
    kpi_id: int,
    payload: KpiProgramar,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Programa un KPI con fecha y hora de inicio y fin en la tabla de auditoría."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos para configurar KPIs.")

    kpi = db.query(Kpi).filter(Kpi.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI no encontrado.")

    # NUEVA VALIDACIÓN: Contar cuántos KPIs del área se cruzan/solapan en este rango de fechas
    activos_count = db.query(KpiProgramado).join(Kpi).filter(
        Kpi.area_id == kpi.area_id,
        KpiProgramado.fecha_inicio <= payload.fecha_fin,
        KpiProgramado.fecha_fin >= payload.fecha_inicio
    ).count()

    if activos_count >= 3:
        raise HTTPException(status_code=400, detail="El área ya tiene el máximo de 3 KPIs programados en este rango de fechas.")

    # Registramos la auditoría (ya no usamos 'semana')
    nuevo_programado = KpiProgramado(
        kpi_id=kpi_id,
        fecha_inicio=payload.fecha_inicio,
        fecha_fin=payload.fecha_fin,
        asignado_por=current_user.id
    )
    db.add(nuevo_programado)
    db.commit()
    return {"message": "KPI programado exitosamente."}
# ══════════════════════════════════════════════════════════════════════════════
#  5. REGISTRO DE VALORES
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/registrar")
def registrar_llenado(
    registro: RegistroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campos = (
        db.query(KpiCampo).filter(KpiCampo.kpi_id == registro.kpi_id).all()
    )

    valor_semanal = cumplimiento = productividad = eficiencia = None
    eficacia = efectividad = rendimiento = None
    alerta = "gris"
    observaciones = ""
    acciones_correctivas = ""

    for c in campos:
        key = c.campo_key
        label = c.campo_label.lower()
        if key not in registro.valores:
            continue
        val = registro.valores[key]
        if val is None or str(val).strip() == "":
            continue

        if "valor semanal" in label:
            valor_semanal = _safe_float(val)
        elif "cumplimiento" in label:
            cumplimiento = _safe_float(val)
        elif "productividad" in label:
            productividad = _safe_float(val)
        elif "eficiencia" in label:
            eficiencia = _safe_float(val)
        elif "eficacia" in label:
            eficacia = _safe_float(val)
        elif "efectividad" in label:
            efectividad = _safe_float(val)
        elif "rendimiento" in label:
            rendimiento = _safe_float(val)
        elif "alerta" in label or "semáforo" in label:
            val_str = str(val).lower()
            if "verde" in val_str:
                alerta = "verde"
            elif "amarillo" in val_str:
                alerta = "amarillo"
            elif "rojo" in val_str:
                alerta = "rojo"
        elif "observaciones" in label:
            observaciones = str(val)
        elif "acciones correctivas" in label:
            acciones_correctivas = str(val)

    nuevo_registro = RegistroKpi(
        usuario_id=current_user.id,
        kpi_id=registro.kpi_id,
        periodo_inicio=registro.periodo_inicio or datetime.now().strftime("%Y-%m-%d"),
        periodo_fin=registro.periodo_fin or datetime.now().strftime("%Y-%m-%d"),
        semana=registro.semana or datetime.now().isocalendar()[1],
        estado="enviado",
        alerta=alerta,
        valor_semanal=valor_semanal,
        cumplimiento=cumplimiento,
        productividad=productividad,
        eficiencia=eficiencia,
        eficacia=eficacia,
        efectividad=efectividad,
        rendimiento=rendimiento,
        observaciones=observaciones,
        acciones_correctivas=acciones_correctivas,
    )
    db.add(nuevo_registro)
    db.flush()
    db.refresh(nuevo_registro)

    for c in campos:
        key = c.campo_key
        if key in registro.valores:
            v_float = _safe_float(registro.valores[key])
            if v_float is not None:
                rv = RegistroValores(
                    registro_id=nuevo_registro.id, campo_id=c.id, valor=v_float
                )
                db.add(rv)

    now = datetime.now()
    programado = db.query(KpiProgramado).filter(
        KpiProgramado.kpi_id == registro.kpi_id,
        KpiProgramado.fecha_inicio <= now,
        KpiProgramado.fecha_fin >= now,
        KpiProgramado.completado == False
    ).first()

    if programado:
        programado.completado = True
        programado.registro_kpi_id = nuevo_registro.id

    db.commit()
    return {
        "message": "Valor registrado con éxito",
        "registro_id": nuevo_registro.id,
        "alerta": alerta,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  6. GESTIÓN DE ÁREAS Y KPIs (CRUD admin)
# ══════════════════════════════════════════════════════════════════════════════

@router.delete("/areas/{area_id:int}")
def delete_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede eliminar áreas.")

    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada.")

    try:
        kpis_ids = [k.id for k in db.query(Kpi).filter(Kpi.area_id == area_id).all()]
        if kpis_ids:
            registros_ids = [
                r.id
                for r in db.query(RegistroKpi).filter(RegistroKpi.kpi_id.in_(kpis_ids)).all()
            ]
            if registros_ids:
                db.query(RegistroValores).filter(
                    RegistroValores.registro_id.in_(registros_ids)
                ).delete(synchronize_session=False)
            db.query(RegistroKpi).filter(RegistroKpi.kpi_id.in_(kpis_ids)).delete(
                synchronize_session=False
            )
            db.query(KpiCampo).filter(KpiCampo.kpi_id.in_(kpis_ids)).delete(
                synchronize_session=False
            )
            db.query(Kpi).filter(Kpi.area_id == area_id).delete(synchronize_session=False)
        db.delete(area)
        db.commit()
        return {"success": True, "message": "Área y todos sus KPIs eliminados correctamente."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/kpi/{kpi_id:int}")
def delete_kpi(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Solo el Administrador (rol 1) puede eliminar KPIs
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede eliminar KPIs.")

    kpi = db.query(Kpi).filter(Kpi.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI no encontrado.")

    try:
        registros_ids = [
            r.id for r in db.query(RegistroKpi).filter(RegistroKpi.kpi_id == kpi_id).all()
        ]
        if registros_ids:
            db.query(RegistroValores).filter(
                RegistroValores.registro_id.in_(registros_ids)
            ).delete(synchronize_session=False)
        db.query(RegistroKpi).filter(RegistroKpi.kpi_id == kpi_id).delete(
            synchronize_session=False
        )
        db.query(KpiCampo).filter(KpiCampo.kpi_id == kpi_id).delete(
            synchronize_session=False
        )
        db.delete(kpi)
        db.commit()
        return {"success": True, "message": "KPI eliminado correctamente."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  7. IMPORTACIÓN DE EXCEL
# ══════════════════════════════════════════════════════════════════════════════

@router.patch("/{kpi_id}/responsable")
def asignar_responsable_kpi(
    kpi_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Asigna un trabajador como responsable de un KPI semanal.
    Solo el Jefe de Área (rol 2) puede hacerlo, y únicamente para KPIs de su área.
    El Administrador (rol 1) también puede hacerlo sin restricción de área.
    """
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos para asignar responsables.")

    kpi = db.query(Kpi).filter(Kpi.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI no encontrado.")

    # Jefe de área solo puede asignar en su propia área
    if current_user.kpi_rol_id == 2 and kpi.area_id != current_user.kpi_area_id:
        raise HTTPException(status_code=403, detail="Solo puedes asignar responsables en tu área.")

    responsable_id = payload.get("responsable_id")

    if responsable_id is None:
        kpi.responsable_id = None
        db.commit()
        return {"success": True, "message": f"KPI '{kpi.nombre}' desasignado."}

    # --- INICIO DE BLOQUE MODIFICADO ---
    trabajador = db.query(User).filter(User.id == responsable_id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado.")
    
    # Validar área EXCEPTO si el que se asigna es Administrador (rol 1)
    if trabajador.kpi_rol_id != 1 and trabajador.kpi_area_id != kpi.area_id:
        raise HTTPException(status_code=400, detail="El trabajador no pertenece al área de este KPI.")
    # --- FIN DE BLOQUE MODIFICADO ---

    kpi.responsable_id = responsable_id
    db.commit()
    return {"success": True, "message": f"Responsable asignado correctamente al KPI '{kpi.nombre}'."}

@router.post("/upload")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede importar Excels.")

    import tempfile
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = _parse_excel_and_save(tmp_path, db)
        return {"success": True, "result": result}
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


@router.post("/upload_smart")
async def upload_smart_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede importar Excels.")

    import tempfile
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        kpis_actualizados = _process_smart_excel(tmp_path, db)
        return {
            "success": True,
            "message": f"¡Diccionario SMART procesado con éxito! Se auto-configuraron {kpis_actualizados} KPIs.",
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


# ──────────────────────────────────────────────────────────────────────────────
#  Helpers internos de importación
# ──────────────────────────────────────────────────────────────────────────────

def _parse_excel_and_save(filepath: str, db: Session) -> dict:
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)

    ws_inicio = wb["Inicio"]
    area_name = None
    for row in ws_inicio.iter_rows(min_row=2, max_row=5, values_only=True):
        if row[1] is not None and str(row[1]).strip():
            area_name = str(row[1]).strip()
            break
    area_name = area_name or "Sin nombre"

    area = db.query(Area).filter(Area.nombre == area_name).first()
    if not area:
        area = Area(nombre=area_name, activo=True)
        db.add(area)
        db.flush()

    SKIP_SHEETS = {
        "Inicio", "Índice de formulas", "Índice de fórmulas",
        "Leyenda de Evaluación de Indica", "Datos de la hoja", "datos de la hoja",
    }

    results = []
    for sheet_name in wb.sheetnames:
        if sheet_name in SKIP_SHEETS:
            continue
        ws = wb[sheet_name]
        info = _extract_kpi_fields_from_sheet(ws)
        if not info:
            continue

        kpi_name = info["kpi_name"] or sheet_name

        kpi = Kpi(
            nombre=kpi_name,
            formula_texto=info["formula"],
            area_id=area.id,
            meta_valor=info["meta_valor"],
            meta_produccion=info["meta_prod"],
            horas_planificadas=info["horas_plan"],
            activo=True,
            activo_semanal=False,
        )
        db.add(kpi)
        db.flush()

        formula_valor_semanal = build_js_formula(info["formula"], info["input_fields"])
        campos_guardados = []

        for orden, col_label in enumerate(info["input_fields"]):
            campo_key = _campo_key(col_label)
            lower_label = col_label.lower()

            tipo = "texto" if any(
                w in lower_label for w in ["observaciones", "acciones", "fecha", "alerta"]
            ) else "numero"

            origen = "usuario"
            formula_pers = None

            if "eficiencia" in lower_label:
                origen, formula_pers = "calculado", "([Horas planificadas] / [Horas reales])"
            elif "eficacia" in lower_label:
                origen, formula_pers = "calculado", "[Cumplimiento (%)] > 1 ? 1 : [Cumplimiento (%)]"
            elif "efectividad" in lower_label:
                origen, formula_pers = "calculado", "([Eficiencia (%)] * [Eficacia (%)])"
            elif "rendimiento" in lower_label:
                origen, formula_pers = "calculado", "([Productividad] / [Meta Producción ≥])"
            elif "alerta" in lower_label:
                origen = "sistema"
            elif "valor semanal" in lower_label:
                origen, formula_pers = "calculado", formula_valor_semanal
            elif any(w in lower_label for w in ["cumplimiento", "productividad", "calculado"]):
                origen = "calculado"
            elif "meta" in lower_label:
                origen = "sistema"

            existing = (
                db.query(KpiCampo)
                .filter(KpiCampo.kpi_id == kpi.id, KpiCampo.campo_key == campo_key)
                .first()
            )
            if not existing:
                campo = KpiCampo(
                    kpi_id=kpi.id,
                    campo_key=campo_key,
                    campo_label=col_label,
                    tipo=tipo,
                    origen=origen,
                    formula_personalizada=formula_pers,
                    es_requerido=False,
                    orden=orden,
                )
                db.add(campo)
                campos_guardados.append(col_label)

        results.append({"sheet": sheet_name, "kpi": kpi_name, "campos_entrada": campos_guardados})

    db.commit()
    wb.close()
    return {"area": area_name, "kpis": results}


def _process_smart_excel(filepath: str, db: Session) -> int:
    df = pd.read_excel(filepath, sheet_name="2_Metas")
    df = df.fillna("")
    kpis_actualizados = 0

    for _, row in df.iterrows():
        nombre_kpi = str(row.get("Nombre KPI", "")).strip()
        tipo_kpi_crudo = str(row.get("Tipo_KPI", "")).strip().lower()
        if not nombre_kpi:
            continue

        kpi = db.query(Kpi).filter(Kpi.nombre == nombre_kpi).first()
        if not kpi:
            continue

        tipo_enum = "Negativo" if tipo_kpi_crudo == "negativo" else "Positivo"
        if hasattr(kpi, "tipo_kpi"):
            kpi.tipo_kpi = tipo_enum

        campos = db.query(KpiCampo).filter(KpiCampo.kpi_id == kpi.id).all()

        label_valor = "[Valor semanal]"
        label_meta = "[Meta KPI]"
        label_meta_prod = "[Meta Producción]"

        for c in campos:
            lbl = c.campo_label.lower()
            if "valor semanal" in lbl:
                label_valor = f"[{c.campo_label}]"
            elif "meta kpi" in lbl:
                label_meta = f"[{c.campo_label}]"
            elif "meta producción" in lbl or "meta produccion" in lbl:
                label_meta_prod = f"[{c.campo_label}]"

        if tipo_enum == "Positivo":
            f_cump = f"({label_meta} === 0 || {label_meta} === null) ? 0 : ({label_valor} / {label_meta})"
            f_prod = f"({label_meta_prod} === 0 || {label_meta_prod} === null) ? 0 : ({label_valor} / {label_meta_prod})"
        else:
            f_cump = (
                f"({label_meta} === 0 || {label_meta} === null) ? "
                f"({label_valor} === 0 ? 1 : 0) : Math.max(0, 1 - ({label_valor} / {label_meta}))"
            )
            f_prod = (
                f"({label_meta_prod} === 0 || {label_meta_prod} === null) ? "
                f"({label_valor} === 0 ? 1 : 0) : Math.max(0, 1 - ({label_valor} / {label_meta_prod}))"
            )

        for c in campos:
            lbl = c.campo_label.lower()
            if "cumplimiento" in lbl:
                c.formula_personalizada = f_cump
                c.origen = "calculado"
            elif "productividad" in lbl:
                c.formula_personalizada = f_prod
                c.origen = "calculado"

        kpis_actualizados += 1

    db.commit()
    return kpis_actualizados


# ══════════════════════════════════════════════════════════════════════════════
#  8. CIERRE AUTOMÁTICO DE KPIs (MÓDULO 2 Y 3)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/cerrar-vencidos")
def cerrar_kpis_vencidos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cierra automáticamente los KPIs cuya fecha_fin ya pasó y no fueron llenados (Omisión)."""
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede ejecutar el cierre de KPIs.")

    now = datetime.now()
    
    # Buscar KPIs programados que ya vencieron y NO han sido completados
    vencidos = db.query(KpiProgramado).filter(
        KpiProgramado.fecha_fin < now,
        KpiProgramado.completado == False
    ).all()

    if not vencidos:
        return {"success": True, "message": "No hay KPIs vencidos pendientes por cerrar.", "cerrados": 0}

    cerrados_count = 0
    for p in vencidos:
        # 1. Crear un registro automático de omisión (Castigo)
        registro_omision = RegistroKpi(
            usuario_id=p.asignado_por or current_user.id, # Asignamos la omisión al jefe/admin por defecto si no tenía responsable
            kpi_id=p.kpi_id,
            periodo_inicio=p.fecha_inicio.strftime("%Y-%m-%d"),
            periodo_fin=p.fecha_fin.strftime("%Y-%m-%d"),
            estado="no_reportado", # Módulo 2: Diferenciar de "enviado"
            alerta="rojo",         # Semáforo rojo innegociable
            valor_semanal=0.0,     # Valor penalizado
            observaciones="Cierre automático por sistema (Fecha vencida sin llenado)",
        )
        db.add(registro_omision)
        db.flush() # Flush para obtener el ID del registro insertado
        
        # 2. Cerrar el ciclo en la programación
        p.completado = True
        p.registro_kpi_id = registro_omision.id
        cerrados_count += 1

    db.commit()
    return {
        "success": True, 
        "message": f"Se cerraron {cerrados_count} KPIs vencidos con reporte de omisión (Rojo).", 
        "cerrados": cerrados_count
    }