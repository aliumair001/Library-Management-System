from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator
from app.schemas.book_schema import BookResponse


class LendBookRequest(BaseModel):
    
    book_id: str = Field(..., description="Book ID to borrow")
    duration_days: Literal[5, 8] = Field(..., description="Lending duration (5 or 8 days)")
    start_date: Optional[str] = Field(default=None, description="Start date for advance lending (ISO format YYYY-MM-DD)")
    
    @field_validator('start_date')
    @classmethod
    def validate_start_date(cls, v: Optional[str]) -> Optional[str]:
        
        if v is not None:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError("start_date must be in ISO format (YYYY-MM-DD)")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_id": "507f1f77bcf86cd799439012",
                "duration_days": 5,
                "start_date": "2025-01-20"
            }
        }


class LendingResponse(BaseModel):
    
    id: str = Field(..., description="Lending ID")
    user_id: str
    book_id: str
    book_title: Optional[str] = None  # Populated by join
    lend_start_date: str  # ISO format
    lend_end_date: str    # ISO format
    actual_return_date: Optional[str] = None
    status: str  # reserved, active, returned, overdue
    created_at: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "user_id": "507f1f77bcf86cd799439011",
                "book_id": "507f1f77bcf86cd799439012",
                "book_title": "The Great Gatsby",
                "lend_start_date": "2025-01-15T00:00:00",
                "lend_end_date": "2025-01-20T00:00:00",
                "actual_return_date": None,
                "status": "active",
                "created_at": "2025-01-15T10:30:00"
            }
        }


class LendingWithBookResponse(BaseModel):
    
    id: str
    book: BookResponse
    lend_start_date: str
    lend_end_date: str
    actual_return_date: Optional[str] = None
    status: str
    created_at: str
    days_remaining: Optional[int] = None  # Calculated field
    is_overdue: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "book": {
                    "id": "507f1f77bcf86cd799439012",
                    "title": "The Great Gatsby",
                    "author": "F. Scott Fitzgerald",
                    "genre": "Classic Fiction",
                    "total_copies": 5,
                    "available_copies": 3
                },
                "lend_start_date": "2025-01-15T00:00:00",
                "lend_end_date": "2025-01-20T00:00:00",
                "actual_return_date": None,
                "status": "active",
                "created_at": "2025-01-15T10:30:00",
                "days_remaining": 5,
                "is_overdue": False
            }
        }


class UserDashboardResponse(BaseModel):
    
    active_lendings: List[LendingWithBookResponse] = Field(default_factory=list, description="Currently borrowed books")
    reserved_lendings: List[LendingWithBookResponse] = Field(default_factory=list, description="Future reservations")
    lending_history: List[LendingWithBookResponse] = Field(default_factory=list, description="Past returned books")
    total_books_borrowed: int = Field(default=0, description="Lifetime borrowed count")
    
    class Config:
        json_schema_extra = {
            "example": {
                "active_lendings": [
                    {
                        "id": "507f1f77bcf86cd799439013",
                        "book": {
                            "id": "507f1f77bcf86cd799439012",
                            "title": "The Great Gatsby",
                            "author": "F. Scott Fitzgerald",
                            "genre": "Classic Fiction",
                            "total_copies": 5,
                            "available_copies": 3
                        },
                        "lend_start_date": "2025-01-15T00:00:00",
                        "lend_end_date": "2025-01-20T00:00:00",
                        "status": "active",
                        "days_remaining": 5
                    }
                ],
                "reserved_lendings": [],
                "lending_history": [],
                "total_books_borrowed": 1
            }
        }