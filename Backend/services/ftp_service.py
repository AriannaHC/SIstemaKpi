# Backend/services/ftp_service.py
import os
from ftplib import FTP
from io import BytesIO

FTP_HOST = os.getenv("FTP_HOST")

# Cuenta dedicada a imágenes, con home ya apuntando a public_html/kpis_uploads
FTP_IMAGES_USER = os.getenv("FTP_IMAGES_USER")
FTP_IMAGES_PASSWORD = os.getenv("FTP_IMAGES_PASSWORD")

# Cuenta dedicada a backups, con home ya apuntando a una carpeta privada
FTP_BACKUPS_USER = os.getenv("FTP_BACKUPS_USER")
FTP_BACKUPS_PASSWORD = os.getenv("FTP_BACKUPS_PASSWORD")

# URL pública base donde quedan servidas las imágenes (incluye ya la subcarpeta)
PUBLIC_URL_BASE = os.getenv(
    "PUBLIC_URL_BASE",
    "https://consultoradeasesoriaempresarialjb.com/kpis_uploads",
)


def _connect(user: str, password: str) -> FTP:
    ftp = FTP()
    ftp.connect(FTP_HOST, 21, timeout=30)
    ftp.login(user, password)
    return ftp


# ── Imágenes (públicas) ──────────────────────────────────────────────

def upload_image_bytes(contenido: bytes, nombre_archivo: str) -> str:
    """Sube una imagen (ya aterriza en kpis_uploads) y devuelve su URL pública."""
    ftp = _connect(FTP_IMAGES_USER, FTP_IMAGES_PASSWORD)
    try:
        ftp.storbinary(f"STOR {nombre_archivo}", BytesIO(contenido))
    finally:
        ftp.quit()
    return f"{PUBLIC_URL_BASE}/{nombre_archivo}"


def download_image_bytes(nombre_archivo: str) -> bytes:
    """Descarga una imagen (usada para incrustarla en el Excel)."""
    ftp = _connect(FTP_IMAGES_USER, FTP_IMAGES_PASSWORD)
    try:
        buffer = BytesIO()
        ftp.retrbinary(f"RETR {nombre_archivo}", buffer.write)
        buffer.seek(0)
        return buffer.read()
    finally:
        ftp.quit()


# ── Backups (privados, cuenta con home fuera de public_html) ─────────

def upload_backup_bytes(contenido: bytes, nombre_archivo: str) -> None:
    ftp = _connect(FTP_BACKUPS_USER, FTP_BACKUPS_PASSWORD)
    try:
        ftp.storbinary(f"STOR {nombre_archivo}", BytesIO(contenido))
    finally:
        ftp.quit()


def list_backups() -> list:
    ftp = _connect(FTP_BACKUPS_USER, FTP_BACKUPS_PASSWORD)
    try:
        archivos = []
        for nombre, facts in ftp.mlsd():
            if nombre.endswith(".sql"):
                archivos.append({
                    "filename": nombre,
                    "size_mb": round(int(facts.get("size", 0)) / 1024 / 1024, 2),
                    "created_at": facts.get("modify", ""),
                })
        archivos.sort(key=lambda x: x["created_at"], reverse=True)
        return archivos
    finally:
        ftp.quit()


def download_backup_bytes(nombre_archivo: str) -> bytes:
    ftp = _connect(FTP_BACKUPS_USER, FTP_BACKUPS_PASSWORD)
    try:
        buffer = BytesIO()
        ftp.retrbinary(f"RETR {nombre_archivo}", buffer.write)
        buffer.seek(0)
        return buffer.read()
    finally:
        ftp.quit()