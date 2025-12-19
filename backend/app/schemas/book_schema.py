from typing import Optional, List
from pydantic import BaseModel, Field

class BookResponse(BaseModel):
    id: str = Field(..., description="Book ID")
    title: str
    author: str
    genre: str
    total_copies: int
    available_copies: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "genre": "Classic Fiction",
                "total_copies": 5,
                "available_copies": 3
            }
        }


class BookSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200, description="Search query")
    limit: int = Field(default=50, ge=1, le=100, description="Maximum results to return")
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "gatsby",
                "limit": 20
            }
        }


class BookSearchResponse(BaseModel):
    
    books: List[BookResponse]
    total: int = Field(..., description="Total number of results")
    query: str = Field(..., description="Original search query")
    
    class Config:
        json_schema_extra = {
            "example": {
                "books": [
                    {
                        "id": "507f1f77bcf86cd799439012",
                        "title": "The Great Gatsby",
                        "author": "F. Scott Fitzgerald",
                        "genre": "Classic Fiction",
                        "total_copies": 5,
                        "available_copies": 3
                    }
                ],
                "total": 1,
                "query": "gatsby"
            }
        }


class BookAvailabilityResponse(BaseModel):
    
    book: BookResponse
    is_available: bool = Field(..., description="Whether book can be borrowed now")
    next_available_date: Optional[str] = Field(default=None, description="When book will be available (ISO format)")
    current_lending_return_date: Optional[str] = Field(default=None, description="Current lending return date")
    
    class Config:
        json_schema_extra = {
            "example": {
                "book": {
                    "id": "507f1f77bcf86cd799439012",
                    "title": "The Great Gatsby",
                    "author": "F. Scott Fitzgerald",
                    "genre": "Classic Fiction",
                    "total_copies": 5,
                    "available_copies": 0
                },
                "is_available": False,
                "next_available_date": "2025-01-20T00:00:00",
                "current_lending_return_date": "2025-01-20T00:00:00"
            }
        }