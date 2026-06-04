# api/kpis.py  —  Migración completa del prototipo Flask al sistema FastAPI
# ─────────────────────────────────────────────────────────────────────────────
# CAMBIOS RESPECTO AL ARCHIVO ANTERIOR:
#   1. get_campos_kpi → serializa correctamente cada KpiCampo a dict (antes
#      devolvía objetos ORM sin convertir → el frontend recibía objetos vacíos)
#   2. get_areas / get_kpis_por_area → el admin (kpi_rol_id == 1) ve TODO;
#      jefe de área y trabajador solo ven su área asignada
#   3. Añadidas rutas de configuración (/configuracion/{kpi_id} GET y POST)
#      que antes solo existían en Flask
#   4. Añadidas rutas de dashboard, upload Excel, upload SMART y delete
#   5. kpiService.js usa el prefijo /api/kpis/ en todos los endpoints → los
#      paths aquí coinciden exactamente con los que llama el frontend
# ─────────────────────────────────────────────────────────────────────────────

import os, re
import openpyxl
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models import User, Kpi, RegistroKpi, KpiCampo, RegistroValores, Area
from schemas.kpi_schema import KpiResponse, RegistroCreate
from api.deps import get_current_user

router = APIRouter(prefix="/api/kpis", tags=["Gestión de KPIs"])

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
#  UTILIDADES (portadas 1:1 desde el prototipo Flask)
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
    """Traduce la fórmula del Excel a notación [Variable] usada por el motor JS."""
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
    """
    Devuelve las áreas disponibles según el rol del usuario:
      - administrador (kpi_rol_id == 1): VE TODAS las áreas activas.
      - jefe_area (kpi_rol_id == 2) y trabajador (kpi_rol_id == 3):
        solo ven su propia área (kpi_area_id).
    """
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
    """
    Devuelve los KPIs de un área.
    El administrador puede consultar cualquier área.
    Jefe/trabajador solo pueden consultar su propia área.
    """
    es_admin = current_user.kpi_rol_id == 1

    # Guardia de seguridad: no-admin no puede ver otra área
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
    """
    Devuelve TODOS los campos dinámicos de un KPI (ordenados por 'orden').
    ─ BUG CORREGIDO: antes se devolvían los objetos ORM directamente y FastAPI
      no los podía serializar → el frontend recibía campos sin atributos.
      Ahora cada campo se convierte explícitamente a dict.
    ─ También devuelve kpi_meta con meta_valor, meta_produccion y
      horas_planificadas para el autocompletado de campos 'sistema'.
    """
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

    # Serialización explícita — CRÍTICO para que el frontend reciba los datos
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
#  2. CONFIGURACIÓN DEL MINI EXCEL (nuevo — antes solo existía en Flask)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/configuracion/{kpi_id:int}")
def get_configuracion(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve los campos de un KPI con su origen y fórmula actual para editar."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos para configurar KPIs.")

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
    """Guarda el origen y la fórmula personalizada de cada campo del KPI."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos para configurar KPIs.")

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
#  3. DASHBOARD — listado completo de áreas y KPIs para el panel admin
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard_data")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve la estructura completa Area → [KPIs] para el panel de administración.
    El admin ve todo; jefe/trabajador solo ven su área.
    """
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
#  4. OPERACIÓN DIARIA — KPIs activos del área del usuario (semana actual)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/diario", response_model=List[KpiResponse])
def obtener_kpis_diarios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve los KPIs activos del área del usuario para la semana actual.
    El admin sin área asignada recibe todos los KPIs activos de todas las áreas.
    """
    es_admin = current_user.kpi_rol_id == 1

    if es_admin and not current_user.kpi_area_id:
        # Admin global: ve todos los KPIs activos
        kpis = db.query(Kpi).filter(Kpi.activo_semanal == True).all()
    elif current_user.kpi_area_id:
        kpis = (
            db.query(Kpi)
            .filter(
                Kpi.area_id == current_user.kpi_area_id,
                Kpi.activo_semanal == True,
            )
            .all()
        )
    else:
        return []

    resultado = [
        KpiResponse(
            id=k.id,
            nombre=k.nombre,
            area_id=k.area_id,
            responsable_id=k.responsable_id,
            meta_valor=k.meta_valor or 0.0,
            activo_semanal=k.activo_semanal,
            es_mi_kpi=(k.responsable_id == current_user.id),
        )
        for k in kpis
    ]
    return sorted(resultado, key=lambda k: k.es_mi_kpi, reverse=True)


@router.post("/{kpi_id}/activar")
def activar_kpi_semanal(
    kpi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Activa/desactiva un KPI para la semana. Máximo 3 activos por área."""
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos para configurar KPIs.")

    kpi = db.query(Kpi).filter(Kpi.id == kpi_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI no encontrado.")

    if not kpi.activo_semanal:
        activos_count = (
            db.query(Kpi)
            .filter(Kpi.area_id == kpi.area_id, Kpi.activo_semanal == True)
            .count()
        )
        if activos_count >= 3:
            raise HTTPException(
                status_code=400,
                detail="El área ya tiene el máximo de 3 KPIs activos esta semana.",
            )

    kpi.activo_semanal = not kpi.activo_semanal
    db.commit()
    estado = "activado" if kpi.activo_semanal else "desactivado"
    return {"message": f"KPI {estado} exitosamente."}


# ══════════════════════════════════════════════════════════════════════════════
#  5. REGISTRO DE VALORES (Mini Excel → BD)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/registrar")
def registrar_llenado(
    registro: RegistroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Recibe el payload {kpi_id, valores: {campo_key: valor}} y guarda el registro.
    Extrae automáticamente semáforo, cumplimiento, eficiencia, etc. del dict de valores.
    """
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
        # Eliminar en cascada: registro_valores → registros_kpi → kpi_campos → kpis → area
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
    if current_user.kpi_rol_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Sin permisos para eliminar KPIs.")

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
#  7. IMPORTACIÓN DE EXCEL (portado desde Flask)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/upload")
async def upload_area_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sube y procesa un Excel de área, creando KPIs y campos dinámicos en la BD."""
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
    """Sube el diccionario SMART y actualiza fórmulas de Cumplimiento/Productividad."""
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
#  Helpers internos de importación (adaptados de Flask a SQLAlchemy)
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

    # Upsert de área
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

        # Crear KPI
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
                origen, formula_pers = "calculado", "([Cumplimiento (%)] * [Eficiencia (%)])"
            elif "alerta" in lower_label:
                origen = "sistema"
            elif "valor semanal" in lower_label:
                origen, formula_pers = "calculado", formula_valor_semanal
            elif any(w in lower_label for w in ["cumplimiento", "productividad", "calculado"]):
                origen = "calculado"
            elif "meta" in lower_label:
                origen = "sistema"

            # Evitar duplicados en la misma sesión
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