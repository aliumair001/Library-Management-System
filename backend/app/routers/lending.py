
from fastapi import APIRouter, Depends, status
from app.services.lending_service import LendingService
from app.schemas.lending_schema import (
    LendBookRequest,
    LendingResponse,
    UserDashboardResponse
)
from app.schemas.user_schema import UserResponse
from app.utils.dependencies import get_lending_service, get_current_user
router = APIRouter(prefix="/lending", tags=["Lending"])
@router.post(
    "/lend",
    response_model=LendingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Lend a book",
    description="""
    Borrow a book immediately or create advance reservation.
    
    """
)
async def lend_book(
    lend_request: LendBookRequest,
    current_user: UserResponse = Depends(get_current_user),
    lending_service: LendingService = Depends(get_lending_service)
):
    """
    Lend book to authenticated user.
    Supports both immediate and advance lending.
    """
    return await lending_service.lend_book(current_user.id, lend_request)


@router.get(
    "/dashboard",
    response_model=UserDashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user lending dashboard",
    description="""
    Fetch user's complete lending information.
    
    """
)
async def get_user_dashboard(
    current_user: UserResponse = Depends(get_current_user),
    lending_service: LendingService = Depends(get_lending_service)
):
    """
    Get authenticated user's lending dashboard.
    Shows active, reserved, and historical lendings.
    """
    return await lending_service.get_user_dashboard(current_user.id)