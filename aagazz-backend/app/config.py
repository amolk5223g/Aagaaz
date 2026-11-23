import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = str(BASE_DIR / ".env")

class Settings(BaseSettings):
    APP_NAME: str = "AAGAZZ 2K26 Backend API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./aagazz.db"
    
    # JWT & Auth
    SECRET_KEY: str = "aagazz-2k26-super-secret-key-deepmind-sgbit-belagavi-luxury"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Event Common Passcode for Direct Ticket Access
    EVENT_ACCESS_CODE: str = "AAGAZZ2026"
    
    # Supabase (optional direct integration)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Brevo Transactional Email API
    BREVO_API_KEY_1: Optional[str] = None
    BREVO_API_KEY_2: Optional[str] = None
    BREVO_SENDER_NAME: str = "Aagaaz"
    BREVO_SENDER_EMAIL: str = "asamol918@gmail.com"
    DEV_OTP_MODE: bool = False
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*"
    ]
    
    model_config = {
        "env_file": ENV_FILE,
        "extra": "ignore"
    }

settings = Settings()
