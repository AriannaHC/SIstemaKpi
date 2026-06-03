from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth

app = FastAPI(title="Sistema KPIs API", version="1.0.0")

# Configurar CORS para permitir que React (Frontend) se comunique con FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar por la URL de React ("http://localhost:5173")
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "API de KPIs funcionando correctamente 🚀"}