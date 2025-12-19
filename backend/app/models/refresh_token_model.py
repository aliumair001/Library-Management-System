from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user_model import PyObjectId

class RefreshTokenModel(BaseModel):
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str = Field(..., description="User ObjectId as string")
    token_hash: str = Field(..., description="SHA256 hash of refresh token")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="Token expiry time")
    is_revoked: bool = Field(default=False)
    device_info: Optional[str] = Field(default=None, description="Device/browser info")
    last_used_at: Optional[datetime] = Field(default=None, description="Last refresh time")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "token_hash": "abc123...",
                "created_at": "2025-01-15T10:30:00",
                "expires_at": "2025-01-22T10:30:00",
                "is_revoked": False,
                "device_info": "Chrome/120.0 Windows",
                "last_used_at": "2025-01-15T12:00:00"
            }
        }