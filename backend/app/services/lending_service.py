from typing import List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from bson import ObjectId

from app.models.lending_model import LendingModel, LendingStatus
from app.schemas.lending_schema import (
    LendBookRequest, 
    LendingResponse, 
    LendingWithBookResponse,
    UserDashboardResponse
)
from app.services.book_service import BookService
from app.schemas.book_schema import BookResponse


class LendingService:
    
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.lendings_collection = db.lendings
        self.books_collection = db.books
        self.book_service = BookService(db)
    
    async def lend_book(self, user_id: str, lend_request: LendBookRequest) -> LendingResponse:
        
        # Fetch book
        book = await self.book_service.get_book_by_id(lend_request.book_id)
        
        # Parse start date (if advance lending)
        start_date = None
        if lend_request.start_date:
            try:
                start_date = datetime.fromisoformat(lend_request.start_date)
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        
        # Determine if immediate or advance lending
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        is_immediate = start_date is None or start_date <= today
        
        if is_immediate:
            # IMMEDIATE LENDING
            return await self._immediate_lending(user_id, book, lend_request.duration_days)
        else:
            # ADVANCE LENDING
            return await self._advance_lending(user_id, book, start_date, lend_request.duration_days)
    
    async def _immediate_lending(
        self, 
        user_id: str, 
        book: BookResponse, 
        duration_days: int
    ) -> LendingResponse:
        # Atomically decrement available_copies only if > 0
        updated_book_doc = await self.books_collection.find_one_and_update(
            {
                "_id": ObjectId(book.id),
                "available_copies": {"$gt": 0},
            },
            {"$inc": {"available_copies": -1}},
            return_document=False,  # we only need to know if a doc was matched
        )

        if not updated_book_doc:
            # Another user took the last copy just before this request
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Book is not currently available. Use advance lending to reserve.",
            )

        # Calculate dates
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return_date = today + timedelta(days=duration_days)
        
        # Create lending record
        lending_model = LendingModel(
            user_id=user_id,
            book_id=book.id,
            lend_start_date=today,
            lend_end_date=return_date,
            status=LendingStatus.ACTIVE
        )
        
        # Insert lending record into database
        result = await self.lendings_collection.insert_one(
            lending_model.model_dump(by_alias=True, exclude={"id"})
        )
        
        # Fetch created lending
        created_lending = await self.lendings_collection.find_one(
            {"_id": result.inserted_id}
        )
        
        return LendingResponse(
            id=str(created_lending["_id"]),
            user_id=created_lending["user_id"],
            book_id=created_lending["book_id"],
            book_title=book.title,
            lend_start_date=created_lending["lend_start_date"].isoformat(),
            lend_end_date=created_lending["lend_end_date"].isoformat(),
            actual_return_date=None,
            status=created_lending["status"],
            created_at=created_lending["created_at"].isoformat()
        )
    
    async def _advance_lending(
        self, 
        user_id: str, 
        book: BookResponse, 
        start_date: datetime,
        duration_days: int
    ) -> LendingResponse:
        
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Validate start date is in future
        if start_date <= today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be in the future for advance lending"
            )
        
        # Find earliest return date from active lendings
        earliest_active = await self.lendings_collection.find_one(
            {
                "book_id": book.id,
                "status": LendingStatus.ACTIVE.value
            },
            sort=[("lend_end_date", 1)]
        )
        
        if earliest_active:
            earliest_return = earliest_active["lend_end_date"].replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            
            # start_date must be >= return date of current lending
            if start_date < earliest_return:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Book is borrowed until {earliest_return.date()}. "
                           f"Please select {earliest_return.date()} or later."
                )
        
        # Check if there's already a reservation
        existing_reservation = await self.lendings_collection.find_one(
            {
                "book_id": book.id,
                "status": LendingStatus.RESERVED.value
            }
        )
        
        if existing_reservation:
            reserved_start = existing_reservation["lend_start_date"].date()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Book is already reserved starting {reserved_start}. "
                       f"Only one advance reservation allowed per book."
            )
        
        # Calculate return date
        return_date = start_date + timedelta(days=duration_days)
        
        # Create reserved lending record
        lending_model = LendingModel(
            user_id=user_id,
            book_id=book.id,
            lend_start_date=start_date,
            lend_end_date=return_date,
            status=LendingStatus.RESERVED
        )
        
        # Insert into database
        result = await self.lendings_collection.insert_one(
            lending_model.model_dump(by_alias=True, exclude={"id"})
        )
        
        # DO NOT decrease available_copies yet (done when reservation activates)
        
        # Fetch created lending
        created_lending = await self.lendings_collection.find_one(
            {"_id": result.inserted_id}
        )
        
        return LendingResponse(
            id=str(created_lending["_id"]),
            user_id=created_lending["user_id"],
            book_id=created_lending["book_id"],
            book_title=book.title,
            lend_start_date=created_lending["lend_start_date"].isoformat(),
            lend_end_date=created_lending["lend_end_date"].isoformat(),
            actual_return_date=None,
            status=created_lending["status"],
            created_at=created_lending["created_at"].isoformat()
        )
    
    async def get_user_dashboard(self, user_id: str) -> UserDashboardResponse:
        
        # Fetch all user lendings
        cursor = self.lendings_collection.find({"user_id": user_id})
        
        active_lendings = []
        reserved_lendings = []
        lending_history = []
        total_count = 0
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        async for lending_doc in cursor:
            total_count += 1
            
            # Fetch book details
            book_doc = await self.books_collection.find_one(
                {"_id": ObjectId(lending_doc["book_id"])}
            )
            
            if not book_doc:
                continue
            
            book = BookResponse(
                id=str(book_doc["_id"]),
                title=book_doc["title"],
                author=book_doc["author"],
                genre=book_doc["genre"],
                total_copies=book_doc["total_copies"],
                available_copies=book_doc["available_copies"]
            )
            
            # Calculate days remaining
            end_date = lending_doc["lend_end_date"].replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            days_remaining = (end_date - today).days
            is_overdue = days_remaining < 0 and lending_doc["status"] == LendingStatus.ACTIVE.value
            
            lending_response = LendingWithBookResponse(
                id=str(lending_doc["_id"]),
                book=book,
                lend_start_date=lending_doc["lend_start_date"].isoformat(),
                lend_end_date=lending_doc["lend_end_date"].isoformat(),
                actual_return_date=lending_doc.get("actual_return_date"),
                status=lending_doc["status"],
                created_at=lending_doc["created_at"].isoformat(),
                days_remaining=days_remaining if days_remaining >= 0 else None,
                is_overdue=is_overdue
            )
            
            # Categorize
            if lending_doc["status"] == LendingStatus.ACTIVE.value:
                active_lendings.append(lending_response)
            elif lending_doc["status"] == LendingStatus.RESERVED.value:
                reserved_lendings.append(lending_response)
            elif lending_doc["status"] == LendingStatus.RETURNED.value:
                lending_history.append(lending_response)
        
        return UserDashboardResponse(
            active_lendings=active_lendings,
            reserved_lendings=reserved_lendings,
            lending_history=lending_history,
            total_books_borrowed=total_count
        )