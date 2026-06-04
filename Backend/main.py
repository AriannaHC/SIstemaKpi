# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, kpis # <-- Importa kpis aquí

app = FastAPI(title="Sistema KPIs API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas
app.include_router(auth.router)
app.include_router(kpis.router) # <-- Añade esta línea

@app.get("/")
def root():
    return {"message": "API de KPIs funcionando correctamente 🚀"}