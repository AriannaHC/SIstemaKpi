from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, kpis, users # <-- Añade users aquí

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

@app.get("/")
def root():
    return {"message": "API de KPIs funcionando correctamente 🚀"}