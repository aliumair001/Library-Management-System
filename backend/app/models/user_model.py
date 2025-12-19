from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class PyObjectId(ObjectId):
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, handler):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, schema, handler):
        schema.update(type="string")
        return schema


class UserModel(BaseModel):
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., description="Unique email address")
    hashed_password: str = Field(..., description="Bcrypt hashed password")
    bio: Optional[str] = Field(default=None, max_length=500, description="User biography")
    profile_picture: Optional[str] = Field(default=None, description="Profile picture URL or base64")
    is_verified: bool = Field(default=False, description="Email verification status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "hashed_password": "$2b$12$...",
                "bio": "Book enthusiast and avid reader",
                "profile_picture": "https://example.com/avatar.jpg",
                "is_verified": True,
                "created_at": "2025-01-15T10:30:00",
                "is_active": True
            }
        }