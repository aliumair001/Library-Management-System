from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_database
from app.core.security import decode_token, verify_token_type
from app.services.auth_service import AuthService
from app.services.book_service import BookService
from app.services.lending_service import LendingService
from app.services.token_service import TokenService
from app.schemas.user_schema import UserResponse



security = HTTPBearer()

def get_auth_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AuthService:
    """Dependency for auth service injection."""
    return AuthService(db)

def get_book_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> BookService:
    """Dependency for book service injection."""
    return BookService(db)

def get_lending_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> LendingService:
    """Dependency for lending service injection."""
    return LendingService(db)

def get_token_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> TokenService:
    """Dependency for token service injection."""
    return TokenService(db)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    
    token = credentials.credentials
    
    # Verify token type
    if not verify_token_type(token, "access"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Decode token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please refresh or login again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extract user_id
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Fetch user
    try:
        user = await auth_service.get_user_by_id(user_id)
        return user
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please login again.",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended."
        )
    
    return current_user