from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from api import auth, kpis, users, analytics, backup, registro_diario
from services.notification_service import check_kpis_por_vencer

app = FastAPI(title="Sistema KPIs API", version="1.0.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    # TIP: Cambia "hours=6" a "minutes=1" si quieres probarlo rápido hoy.
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