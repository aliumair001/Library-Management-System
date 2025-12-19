import hashlib
from datetime import datetime, timedelta
from typing import Tuple, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_token_type
from app.models.refresh_token_model import RefreshTokenModel


class TokenService:
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.refresh_tokens_collection = db.refresh_tokens
    
    def _hash_token(self, token: str) -> str:
        
        return hashlib.sha256(token.encode()).hexdigest()
    
    async def create_tokens(self, user_id: str, device_info: Optional[str] = None) -> Tuple[str, str]:
        
        access_token = create_access_token(data={"sub": user_id})
        refresh_token = create_refresh_token(data={"sub": user_id})
        
        # Calculate refresh token expiry
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Store refresh token hash in database
        refresh_token_model = RefreshTokenModel(
            user_id=user_id,
            token_hash=self._hash_token(refresh_token),
            expires_at=expires_at,
            device_info=device_info
        )
        
        await self.refresh_tokens_collection.insert_one(
            refresh_token_model.model_dump(by_alias=True, exclude={"id"})
        )
        
        return access_token, refresh_token
    
    async def refresh_access_token(self, refresh_token: str) -> Tuple[str, str]:

        if not verify_token_type(refresh_token, "refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Expected refresh token."
            )
        
        # Decode token
        payload = decode_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload."
            )
        
        # Check token exists in database and not revoked
        token_hash = self._hash_token(refresh_token)
        stored_token = await self.refresh_tokens_collection.find_one({
            "token_hash": token_hash,
            "user_id": user_id,
            "is_revoked": False
        })
        
        if not stored_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token revoked or not found. Please login again."
            )
        
        # Check expiry
        if datetime.utcnow() > stored_token["expires_at"]:
            # Revoke expired token
            await self.refresh_tokens_collection.update_one(
                {"_id": stored_token["_id"]},
                {"$set": {"is_revoked": True}}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired. Please login again."
            )
        
        # Revoke old refresh token
        await self.refresh_tokens_collection.update_one(
            {"_id": stored_token["_id"]},
            {"$set": {"is_revoked": True}}
        )
        
        # Generate new tokens
        new_access_token, new_refresh_token = await self.create_tokens(
            user_id=user_id,
            device_info=stored_token.get("device_info")
        )
        
        return new_access_token, new_refresh_token
    
    async def revoke_token(self, refresh_token: str) -> bool:
        
        
        token_hash = self._hash_token(refresh_token)
        
        result = await self.refresh_tokens_collection.update_one(
            {"token_hash": token_hash},
            {"$set": {"is_revoked": True}}
        )
        
        return result.modified_count > 0
    
    async def revoke_all_user_tokens(self, user_id: str) -> int:
        
        result = await self.refresh_tokens_collection.update_many(
            {
                "user_id": user_id,
                "is_revoked": False
            },
            {"$set": {"is_revoked": True}}
        )
        
        return result.modified_count
    
    async def cleanup_expired_tokens(self) -> int:
        
        result = await self.refresh_tokens_collection.delete_many({
            "expires_at": {"$lt": datetime.utcnow()}
        })
        
        return result.deleted_count