from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # 1. Truco para compatibilidad con el Bcrypt generado por Laravel/PHP ($2y$)
    if hashed_password.startswith("$2y$"):
        hashed_password = hashed_password.replace("$2y$", "$2b$")
    
    # 2. Bcrypt en Python moderno requiere que los textos se conviertan a bytes
    password_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    
    try:
        # 3. Verificamos la contraseña directamente con la librería bcrypt
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    # Reducimos los "rounds" a 8 para aliviar la CPU de Render
    salt = bcrypt.gensalt(rounds=8)
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def needs_rehash(hashed_password: str) -> bool:
    """Verifica si la contraseña es antigua (Laravel) o tiene más de 8 vueltas"""
    # Si es de Laravel o no empieza con la firma de 8 vueltas de Python, necesita cambio
    return hashed_password.startswith("$2y$") or not hashed_password.startswith("$2b$08$")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt