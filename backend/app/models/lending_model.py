from datetime import datetime
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user_model import PyObjectId

class LendingStatus(str, Enum):
    
    RESERVED = "reserved"
    ACTIVE = "active"
    RETURNED = "returned"
    OVERDUE = "overdue"

class LendingModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str = Field(..., description="User ObjectId as string")
    book_id: str = Field(..., description="Book ObjectId as string")
    lend_start_date: datetime = Field(..., description="Lending start date")
    lend_end_date: datetime = Field(..., description="Expected return date")
    actual_return_date: Optional[datetime] = Field(default=None, description="Actual return date")
    status: LendingStatus = Field(default=LendingStatus.ACTIVE)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "book_id": "507f1f77bcf86cd799439012",
                "lend_start_date": "2025-01-15T00:00:00",
                "lend_end_date": "2025-01-20T00:00:00",
                "actual_return_date": None,
                "status": "active",
                "created_at": "2025-01-15T10:30:00"
            }
        }
    
    def model_dump(self, **kwargs):
        """Override to handle ObjectId serialization"""
        data = super().model_dump(**kwargs)
        if "_id" in data and data["_id"] is not None:
            data["_id"] = str(data["_id"])
        return data