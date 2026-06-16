# Backend/services/notification_service.py
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from db.database import SessionLocal
from db.models import Notification, KpiProgramado, Kpi

def crear_notificacion(db: Session, title: str, body: str, audience: str, audience_value: str, created_by: str):
    """
    Inserta una notificación en la BD compartida.
    audience puede ser: 'all', 'area' o 'user'.
    """
    nueva_notif = Notification(
        id=str(uuid.uuid4()),
        title=title,
        body=body,
        audience=audience,
        audience_value=str(audience_value) if audience_value else None,
        created_by=str(created_by)
    )
    db.add(nueva_notif)
    db.commit()
    db.refresh(nueva_notif)
    return nueva_notif


def check_kpis_por_vencer():
    """
    Función para el Scheduler: Busca KPIs que vencen en <= 24h 
    y genera alertas automáticas para el responsable.
    """
    db = SessionLocal()
    try:
        now = datetime.now()
        umbral = now + timedelta(hours=24)

        # Buscar programaciones vigentes, no completadas, que vencen en < 24h
        por_vencer = db.query(KpiProgramado).join(Kpi).filter(
            KpiProgramado.fecha_fin <= umbral,
            KpiProgramado.fecha_fin > now,
            KpiProgramado.completado == False
        ).all()

        for p in por_vencer:
            kpi = db.query(Kpi).filter(Kpi.id == p.kpi_id).first()
            if not kpi or not kpi.responsable_id:
                continue # Si el KPI no tiene un responsable asignado, lo saltamos

            # Candado anti-spam: Evita mandarle la misma alerta varias veces
            idem_key = f"vence_24h_{p.id}"
            
            ya_existe = db.query(Notification).filter(
                Notification.idempotency_key == idem_key
            ).first()

            if ya_existe:
                continue 

            horas_restantes = int((p.fecha_fin - now).total_seconds() / 3600)
            
            nueva_notif = Notification(
                id=str(uuid.uuid4()),
                title="⏰ ¡Tu KPI está por vencer!",
                body=f"El registro para '{kpi.nombre}' vence en aprox. {horas_restantes} horas. ¡Llénalo antes de que se cierre!",
                audience="user",
                audience_value=kpi.responsable_id,
                created_by="system", 
                idempotency_key=idem_key 
            )
            db.add(nueva_notif)
        
        db.commit()
    except Exception as e:
        print(f"Error en el scheduler de notificaciones: {e}")
    finally:
        db.close() # Cierra la conexión del hilo automático