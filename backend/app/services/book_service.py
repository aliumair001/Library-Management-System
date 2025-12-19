
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from bson import ObjectId
from app.schemas.book_schema import BookResponse, BookSearchResponse, BookAvailabilityResponse
from app.models.lending_model import LendingStatus
from datetime import datetime


class BookService:
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.books_collection = db.books
        self.lendings_collection = db.lendings
    
    async def search_books(self, query: str, limit: int = 50) -> BookSearchResponse:
        """
        Search books using MongoDB text search.
        
        Args:
            query: Search query string
            limit: Maximum number of results
            
        Returns:
            BookSearchResponse with matching books
        """
        
        try:
            # Use MongoDB text search (searches title, author, genre)
            # $text operator uses the text index we created
            cursor = self.books_collection.find(
                {"$text": {"$search": query}},
                {"score": {"$meta": "textScore"}}  # Sort by relevance
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            books = []
            async for book_doc in cursor:
                books.append(BookResponse(
                    id=str(book_doc["_id"]),
                    title=book_doc["title"],
                    author=book_doc["author"],
                    genre=book_doc["genre"],
                    total_copies=book_doc["total_copies"],
                    available_copies=book_doc["available_copies"]
                ))
            
            return BookSearchResponse(
                books=books,
                total=len(books),
                query=query
            )
        
        except Exception as e:
            # If text index doesn't exist, fall back to regex search
            if "text index required" in str(e).lower():
                # Fallback to regex search across title, author, genre
                pattern = {"$regex": query, "$options": "i"}
                cursor = self.books_collection.find({
                    "$or": [
                        {"title": pattern},
                        {"author": pattern},
                        {"genre": pattern}
                    ]
                }).limit(limit)
                
                books = []
                async for book_doc in cursor:
                    books.append(BookResponse(
                        id=str(book_doc["_id"]),
                        title=book_doc["title"],
                        author=book_doc["author"],
                        genre=book_doc["genre"],
                        total_copies=book_doc["total_copies"],
                        available_copies=book_doc["available_copies"]
                    ))
                
                return BookSearchResponse(
                    books=books,
                    total=len(books),
                    query=query
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Search failed: {str(e)}"
                )
    
    async def get_book_by_id(self, book_id: str) -> BookResponse:
        """
        Fetch single book by ID.
        
        Args:
            book_id: MongoDB ObjectId as string
            
        Returns:
            BookResponse with book data
            
        Raises:
            HTTPException 404: If book not found
        """
        
        try:
            book_doc = await self.books_collection.find_one(
                {"_id": ObjectId(book_id)}
            )
            
            if not book_doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Book not found"
                )
            
            return BookResponse(
                id=str(book_doc["_id"]),
                title=book_doc["title"],
                author=book_doc["author"],
                genre=book_doc["genre"],
                total_copies=book_doc["total_copies"],
                available_copies=book_doc["available_copies"]
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid book ID"
            )
    
    async def check_book_availability(self, book_id: str) -> BookAvailabilityResponse:
        """
        Check if book is available for immediate lending.
        If not available, return when it will be available next.
        
        Business Logic:
        - If available_copies > 0: Book is available now
        - If available_copies = 0: Find earliest return date from active lendings
        
        Args:
            book_id: MongoDB ObjectId as string
            
        Returns:
            BookAvailabilityResponse with availability details
        """
        
        # Fetch book
        book = await self.get_book_by_id(book_id)
        
        # Check if available now
        if book.available_copies > 0:
            return BookAvailabilityResponse(
                book=book,
                is_available=True,
                next_available_date=None,
                current_lending_return_date=None
            )
        
        # Book not available - find earliest return date
        # Look for active or reserved lendings for this book
        earliest_lending = await self.lendings_collection.find_one(
            {
                "book_id": book_id,
                "status": {"$in": [LendingStatus.ACTIVE.value, LendingStatus.RESERVED.value]}
            },
            sort=[("lend_end_date", 1)]  # Sort by end date ascending (earliest first)
        )
        
        if earliest_lending:
            return_date = earliest_lending["lend_end_date"].isoformat()
            return BookAvailabilityResponse(
                book=book,
                is_available=False,
                next_available_date=return_date,
                current_lending_return_date=return_date
            )
        
        # No active lendings but available_copies = 0 (data inconsistency)
        # This shouldn't happen but handle gracefully
        return BookAvailabilityResponse(
            book=book,
            is_available=False,
            next_available_date=None,
            current_lending_return_date=None
        )
    
    async def get_all_books(self, limit: int = 100) -> List[BookResponse]:
        """
        Fetch all books (for browsing).
        Used when no search query provided.
        
        Args:
            limit: Maximum number of books to return
            
        Returns:
            List of BookResponse objects
        """
        
        cursor = self.books_collection.find().limit(limit)
        books = []
        
        async for book_doc in cursor:
            books.append(BookResponse(
                id=str(book_doc["_id"]),
                title=book_doc["title"],
                author=book_doc["author"],
                genre=book_doc["genre"],
                total_copies=book_doc["total_copies"],
                available_copies=book_doc["available_copies"]
            ))
        
        return books
    
    async def update_available_copies(
        self, 
        book_id: str, 
        increment: int
    ) -> None:
        """
        Update available copies count.
        
        Used by lending service to:
        - Decrease when book is lent (increment = -1)
        - Increase when book is returned (increment = +1)
        
        Args:
            book_id: MongoDB ObjectId as string
            increment: Number to add (negative to decrease)
            
        Raises:
            HTTPException: If update fails
        """
        
        result = await self.books_collection.update_one(
            {"_id": ObjectId(book_id)},
            {"$inc": {"available_copies": increment}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )