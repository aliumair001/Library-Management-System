from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user_model import PyObjectId

class BookModel(BaseModel):
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1, max_length=100)
    genre: str = Field(..., min_length=1, max_length=50)
    total_copies: int = Field(..., ge=1, description="Total copies in library")
    available_copies: int = Field(..., ge=0, description="Available copies for lending")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "genre": "Classic Fiction",
                "total_copies": 5,
                "available_copies": 3
            }
        }
    
    def model_dump(self, **kwargs):
        """Override to handle ObjectId serialization"""
        data = super().model_dump(**kwargs)
        if "_id" in data and data["_id"] is not None:
            data["_id"] = str(data["_id"])
        return data