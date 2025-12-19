from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserResponse(BaseModel):
    """User profile response with all profile fields."""
    
    id: str = Field(..., description="User ID")
    name: str
    email: EmailStr
    bio: Optional[str] = Field(default=None, description="User biography")
    profile_picture: Optional[str] = Field(default=None, description="Profile picture URL")
    is_verified: bool = Field(..., description="Email verification status")
    created_at: datetime
    is_active: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "John Doe",
                "email": "john@example.com",
                "bio": "Book lover and tech enthusiast",
                "profile_picture": "https://example.com/avatar.jpg",
                "is_verified": True,
                "created_at": "2025-01-15T10:30:00",
                "is_active": True
            }
        }


class UpdateProfileRequest(BaseModel):
    """Request to update user profile."""
    
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Full name")
    bio: Optional[str] = Field(None, max_length=500, description="User biography")
    profile_picture: Optional[str] = Field(None, description="Profile picture URL or base64 data")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Name must be at least 2 characters")
            if len(v) > 100:
                raise ValueError("Name must be at most 100 characters")
        return v
    
    @field_validator('bio')
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Bio must be at most 500 characters")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "bio": "Passionate reader and book collector",
                "profile_picture": "data:image/jpeg;base64,/9j/4AAQ..."
            }
        }


class UpdateProfileResponse(BaseModel):
    """Response after profile update."""
    
    message: str = "Profile updated successfully"
    user: UserResponse