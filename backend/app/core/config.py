from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Firebase
    FIREBASE_STORAGE_BUCKET: str = "hotel-backend-87480.firebasestorage.app"
    
    # Email
    MAILGUN_API_KEY: str
    MAILGUN_DOMAIN: str
    EMAIL_FROM: str = "reservations@{MAILGUN_DOMAIN}"
    
    # Security
    ADMIN_SECRET: str
    CRON_SECRET: str
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "https://fir-restaurant-reservati-5ac70.web.app",
        "http://localhost:5173"
    ]
    
    # Frontend
    FRONTEND_BASE_URL: str = "https://fir-restaurant-reservati-5ac70.web.app"
    
    # Timezone
    LOCAL_TIMEZONE: str = "Africa/Cairo"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
