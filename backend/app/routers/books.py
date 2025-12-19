from fastapi import APIRouter, Depends, Query, status
from typing import List
from app.services.book_service import BookService
from app.schemas.book_schema import (
    BookResponse,
    BookSearchResponse,
    BookAvailabilityResponse
)
from app.schemas.user_schema import UserResponse
from app.utils.dependencies import get_book_service, get_current_user
router = APIRouter(prefix="/books", tags=["Books"])

@router.get(
    "/search",
    response_model=BookSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search books",
    description="""
    Smart search across book title, author, and genre.
    """
)
async def search_books(
    query: str = Query(..., min_length=1, description="Search query (min 1 character)"),
    limit: int = Query(default=10, ge=1, le=100, description="Max results"),
    current_user: UserResponse = Depends(get_current_user),
    book_service: BookService = Depends(get_book_service)
):
    """
    Search books by title, author, or genre.
    Protected route - requires authentication.
    """
    return await book_service.search_books(query, limit)


@router.get(
    "/all",
    response_model=List[BookResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all books",
    description="""
    Fetch all books in library (for browsing).
    
    """
)
async def get_all_books(
    limit: int = Query(100, ge=1, le=200, description="Max results"),
    current_user: UserResponse = Depends(get_current_user),
    book_service: BookService = Depends(get_book_service)
):
    """
    Get all books in library.
    Protected route - requires authentication.
    """
    return await book_service.get_all_books(limit)


@router.get(
    "/{book_id}",
    response_model=BookResponse,
    status_code=status.HTTP_200_OK,
    summary="Get book by ID",
    description="""
    Fetch single book details by ID.
    
    """
)
async def get_book(
    book_id: str,
    current_user: UserResponse = Depends(get_current_user),
    book_service: BookService = Depends(get_book_service)
):
    """
    Get single book by ID.
    Protected route - requires authentication.
    """
    return await book_service.get_book_by_id(book_id)


@router.get(
    "/{book_id}/availability",
    response_model=BookAvailabilityResponse,
    status_code=status.HTTP_200_OK,
    summary="Check book availability",
    description="""
    Check if book is available for lending.
    
    """
)
async def check_book_availability(
    book_id: str,
    current_user: UserResponse = Depends(get_current_user),
    book_service: BookService = Depends(get_book_service)
):
    """
    Check book availability and return next available date if not available.
    Protected route - requires authentication.
    """
    return await book_service.check_book_availability(book_id)