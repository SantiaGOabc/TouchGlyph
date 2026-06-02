import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / '.env')

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY no está definida en .env")
    
    # JWT
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", 120))
    
    #database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME", "braille_db")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_TYPE = os.getenv("DB_TYPE", "sqlite")
    DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 10))
    
    if DB_TYPE == "mysql":
        if not DB_USER:
            raise ValueError("DB_USER es requerido cuando DB_TYPE=mysql")
        if not DB_PASSWORD:
            raise ValueError("DB_PASSWORD es requerido cuando DB_TYPE=mysql")
    
    #ports
    STUDENT_SERVICE_PORT = int(os.getenv("STUDENT_SERVICE_PORT", 5003))
    USER_SERVICE_PORT = int(os.getenv("USER_SERVICE_PORT", 8000))
    ADMIN_SERVICE_PORT = int(os.getenv("ADMIN_SERVICE_PORT", 5001))
    TEACHER_SERVICE_PORT = int(os.getenv("TEACHER_SERVICE_PORT", 5002))
    DEVICES_SERVICE_PORT = int(os.getenv("DEVICES_SERVICE_PORT", 5004))
    
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    CORS_ALLOW_ALL = os.getenv("CORS_ALLOW_ALL", "False").lower() == "true"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "60 per minute")
    RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "10 per minute")
    
    #face
    FACE_MODEL_NAME = os.getenv("FACE_MODEL_NAME", "Facenet512")
    FACE_DETECTOR_BACKEND = os.getenv("FACE_DETECTOR_BACKEND", "opencv")
    FACE_DISTANCE_THRESHOLD = float(os.getenv("FACE_DISTANCE_THRESHOLD", 0.4))
    
    #esp
    ESP32_IP = os.getenv("ESP32_IP", "192.168.4.1")
    ESP32_BASE_URL = f"http://{ESP32_IP}"
    ESP32_TIMEOUT = int(os.getenv("ESP32_TIMEOUT", 10))

config = Config()