# Backend/core/config.py
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Carga las variables de entorno desde el archivo .env
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema KPIs - API"
    
    # Lee la URL desde el .env, si no existe, cae en el valor de localhost
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:@localhost:3306/u396689162_asistencia"
    )
    
    SECRET_KEY: str = "super_secreta_clave_para_jwt_cambiar_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 horas

settings = Settings()