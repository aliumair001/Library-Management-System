
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
     # MongoDB Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "library_management_db"
    
    # JWT Configuration
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production-min-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OTP Configuration
    STATIC_OTP: str = "123456"  # Static OTP for testing
    OTP_EXPIRE_MINUTES: int = 10
    
    # CORS - Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Application Settings
    APP_NAME: str = "Library Management System"
    DEBUG: bool = True
    
    # Lending Configuration
    LENDING_DURATION_OPTIONS: list = [5, 8]
    MAX_ADVANCE_BOOKING_DAYS: int = 90
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()