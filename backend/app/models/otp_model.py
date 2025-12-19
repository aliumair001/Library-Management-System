from datetime import datetime
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from app.models.user_model import PyObjectId

class OTPPurpose(str, Enum):
    
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"

class OTPModel(BaseModel):
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr = Field(..., description="Email address")
    otp_code: str = Field(..., description="OTP code (static 123456)")
    purpose: OTPPurpose = Field(..., description="OTP purpose")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="OTP expiry time")
    is_used: bool = Field(default=False)
    attempts: int = Field(default=0, description="Verification attempts")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "otp_code": "123456",
                "purpose": "email_verification",
                "created_at": "2025-01-15T10:30:00",
                "expires_at": "2025-01-15T10:40:00",
                "is_used": False,
                "attempts": 0
            }
        }