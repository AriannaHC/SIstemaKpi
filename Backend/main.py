# Backend/main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler

from api import auth, kpis, users, analytics, backup, registro_diario
from services.notification_service import check_kpis_por_vencer

# Carga las variables de entorno
load_dotenv()

app = FastAPI(title="Sistema KPIs API", version="1.0.0")

# Servir la carpeta uploads como archivos estáticos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Leer la URL del frontend desde el .env para los CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)
app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(auth.router)
app.include_router(kpis.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(backup.router)
app.include_router(registro_diario.router)

# --- Configuración del Scheduler ---
scheduler = BackgroundScheduler()

@app.on_event("startup")
def startup_event():
    # El bot se ejecutará cada 6 horas
    scheduler.add_job(check_kpis_por_vencer, 'interval', hours=6, id='check_vencimiento_kpis')
    scheduler.start()
    print("⏳ Scheduler de Notificaciones iniciado...")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("⏳ Scheduler apagado.")
# -----------------------------------

@app.get("/")
def root():
    return {"message": "API de KPIs funcionando correctamente 🚀"}

# --- Endpoint Despertador para Render ---
@app.get("/api/ping", tags=["Health Check"])
def ping_server():
    """Endpoint ligero para mantener vivo el servidor"""
    return {"status": "ok", "message": "Backend de KPIs activo y despierto"}