"""
OTP service for generating and validating OTPs.
Uses static OTP "123456" for testing.
"""

from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.otp_model import OTPModel, OTPPurpose


class OTPService:
    """
    OTP generation and validation service.
    
    Static OTP: 123456 (for testing)
    In production: Would generate random 6-digit code
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.otp_collection = db.otps
    
    async def generate_otp(self, email: str, purpose: OTPPurpose) -> str:
        """
        Generate OTP for email verification or password reset.
        
        Steps:
        1. Invalidate any existing OTPs for this email+purpose
        2. Generate OTP (static "123456")
        3. Calculate expiry (10 minutes)
        4. Store in database
        5. Return OTP code
        
        Args:
            email: User's email address
            purpose: OTPPurpose.EMAIL_VERIFICATION or OTPPurpose.PASSWORD_RESET
            
        Returns:
            OTP code (always "123456" for testing)
            
        Note:
            In production, you would:
            - Generate random 6-digit code
            - Send via email service
            - Not return the code (security)
        """
        
        # Invalidate existing OTPs for this email+purpose
        await self.otp_collection.update_many(
            {
                "email": email.lower(),
                "purpose": purpose.value,
                "is_used": False
            },
            {"$set": {"is_used": True}}
        )
        
        # Generate OTP (static for testing)
        otp_code = settings.STATIC_OTP
        
        # Calculate expiry
        expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        
        # Create OTP record
        otp_model = OTPModel(
            email=email.lower(),
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at
        )
        
        # Store in database
        await self.otp_collection.insert_one(
            otp_model.model_dump(by_alias=True, exclude={"id"})
        )
        
        # In production: Send email here
        # await email_service.send_otp(email, otp_code)
        
        return otp_code
    
    async def verify_otp(self, email: str, otp_code: str, purpose: OTPPurpose) -> bool:
        """
        Verify OTP code.
        
        Validation:
        1. Find OTP record for email+purpose
        2. Check not expired
        3. Check not already used
        4. Check attempts < 3
        5. Verify code matches
        
        Args:
            email: User's email address
            otp_code: OTP code to verify
            purpose: OTP purpose
            
        Returns:
            True if valid, raises HTTPException otherwise
            
        Raises:
            HTTPException 400: If OTP invalid, expired, or too many attempts
        """
        
        # Find latest unused OTP for this email+purpose
        otp_record = await self.otp_collection.find_one(
            {
                "email": email.lower(),
                "purpose": purpose.value,
                "is_used": False
            },
            sort=[("created_at", -1)]  # Get latest
        )
        
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid OTP found. Please request a new OTP."
            )
        
        # Check expiry
        if datetime.utcnow() > otp_record["expires_at"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new OTP."
            )
        
        # Check attempts
        if otp_record["attempts"] >= 3:
            # Mark as used to prevent further attempts
            await self.otp_collection.update_one(
                {"_id": otp_record["_id"]},
                {"$set": {"is_used": True}}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new OTP."
            )
        
        # Increment attempts
        await self.otp_collection.update_one(
            {"_id": otp_record["_id"]},
            {"$inc": {"attempts": 1}}
        )
        
        # Verify OTP code
        if otp_record["otp_code"] != otp_code:
            attempts_left = 3 - (otp_record["attempts"] + 1)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid OTP. {attempts_left} attempts remaining."
            )
        
        # Mark OTP as used
        await self.otp_collection.update_one(
            {"_id": otp_record["_id"]},
            {"$set": {"is_used": True}}
        )
        
        return True
    
    async def cleanup_expired_otps(self) -> int:
        
        result = await self.otp_collection.delete_many(
            {"expires_at": {"$lt": datetime.utcnow()}}
        )
        return result.deleted_count