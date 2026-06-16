import subprocess
import os
import glob
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.engine import make_url

# Ajusta estos imports si tu estructura varía un poco
from core.config import settings
from db.models import User
from api.deps import get_current_user

BACKUP_DIR = "uploads/backups"
os.makedirs(BACKUP_DIR, exist_ok=True)

router = APIRouter(prefix="/api/backup", tags=["Backups"])

# 🔴 FIX: Especificamos EXACTAMENTE las tablas del ecosistema KPI + Usuarios
TABLAS_KPI = "areas kpi_roles users kpis kpi_campos kpis_programados registros_kpi registro_valores notifications notification_reads"

@router.post("/generate")
def generate_backup(current_user: User = Depends(get_current_user)):
    # Solo el Admin (1) puede hacer esto
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Solo el administrador puede generar backups.")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_kpis_{timestamp}.sql"
    filepath = os.path.join(BACKUP_DIR, filename)

    try:
        # Extraer credenciales dinámicamente de tu DATABASE_URL
        db_url = make_url(settings.DATABASE_URL)
        db_user = db_url.username
        db_password = db_url.password
        db_host = db_url.host or "localhost"
        db_name = db_url.database

        ruta_mysqldump = r"C:\xampp\mysql\bin\mysqldump.exe"
        
        # Si por alguna razón no existe esa ruta (o estás en Mac/Linux), usa el comando simple
        if not os.path.exists(ruta_mysqldump):
            ruta_mysqldump = "mysqldump"

        # Construir el comando mysqldump usando la ruta exacta
        pwd_arg = f"-p{db_password}" if db_password else ""
        cmd = f'"{ruta_mysqldump}" -u {db_user} {pwd_arg} -h {db_host} {db_name} {TABLAS_KPI} > "{filepath}"'

        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            # Si el comando falla, borramos el archivo vacío que se haya creado
            if os.path.exists(filepath):
                os.remove(filepath)
            raise HTTPException(status_code=500, detail=f"Error en mysqldump: {result.stderr}")

        size = os.path.getsize(filepath)
        return {
            "success": True,
            "filename": filename, 
            "size_mb": round(size / 1024 / 1024, 2), 
            "created_at": timestamp
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
def list_backups(current_user: User = Depends(get_current_user)):
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Sin permisos.")

    archivos = glob.glob(os.path.join(BACKUP_DIR, "*.sql"))
    
    backups = []
    for ruta in archivos:
        nombre = os.path.basename(ruta)
        tamano = os.path.getsize(ruta)
        # Fecha de modificación del archivo
        fecha_mod = datetime.fromtimestamp(os.path.getmtime(ruta)).strftime("%Y-%m-%d %H:%M:%S")
        
        backups.append({
            "filename": nombre,
            "size_mb": round(tamano / 1024 / 1024, 2),
            "created_at": fecha_mod
        })
    
    # Ordenar del más reciente al más antiguo
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    return backups


@router.get("/download/{filename}")
def download_backup(filename: str, current_user: User = Depends(get_current_user)):
    if current_user.kpi_rol_id != 1:
        raise HTTPException(status_code=403, detail="Sin permisos.")

    # Validar path traversal
    if "/" in filename or "\\" in filename or not filename.endswith(".sql"):
        raise HTTPException(status_code=400, detail="Nombre de archivo inválido.")

    filepath = os.path.join(BACKUP_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="El archivo de backup no existe.")

    return FileResponse(
        path=filepath, 
        filename=filename, 
        media_type="application/sql"
    )