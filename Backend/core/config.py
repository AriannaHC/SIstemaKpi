from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema KPIs - API"
    # Cambia las credenciales según tu entorno local
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/u396689162_asistencia"
    
    SECRET_KEY: str = "super_secreta_clave_para_jwt_cambiar_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 horas

settings = Settings()