from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from bson import ObjectId

from app.core.security import hash_password, verify_password
from app.models.user_model import UserModel
from app.models.otp_model import OTPPurpose
from app.schemas.user_schema import UserResponse
from app.services.otp_service import OTPService
from app.services.token_service import TokenService


class AuthService:
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users_collection = db.users
        self.otp_service = OTPService(db)
        self.token_service = TokenService(db)
    
    async def signup_user(self, name: str, email: str, password: str) -> dict:
        try:
            print(f"\n👤 Signup attempt for: {email}")
            
            # Check existing user
            existing_user = await self.users_collection.find_one(
                {"email": email.lower()}
            )
            
            if existing_user:
                print(f"   ❌ Email already registered: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered."
                )
            
            print(f"   ✅ Email available")
            
            # Create user
            user_model = UserModel(
                name=name,
                email=email.lower(),
                hashed_password=hash_password(password),
                is_verified=False  # Requires OTP verification
            )
            
            print(f"   💾 Inserting user into database...")
            result = await self.users_collection.insert_one(
                user_model.model_dump(by_alias=True, exclude={"id"})
            )
            print(f"   ✅ User created with ID: {result.inserted_id}")
            
            # Generate OTP
            print(f"   🔑 Generating OTP...")
            otp_code = await self.otp_service.generate_otp(
                email=email.lower(),
                purpose=OTPPurpose.EMAIL_VERIFICATION
            )
            
            # In production: Email would be sent here
            # For testing: OTP is printed in console
            print(f"   ✅ OTP Generated: {otp_code}")
            print(f"   📧 OTP for {email}: {otp_code}\n")
            
            return {
                "message": "Signup successful. Please verify your email with OTP: 123456",
                "email": email.lower(),
                "otp_sent": True
            }
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"   ❌ Signup error: {str(e)}")
            print(f"   Error type: {type(e).__name__}\n")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Signup failed: {str(e)}"
            )
    
    async def verify_email(self, email: str, otp_code: str) -> dict:
        
        await self.otp_service.verify_otp(
            email=email.lower(),
            otp_code=otp_code,
            purpose=OTPPurpose.EMAIL_VERIFICATION
        )
        
        # Update user verification status
        result = await self.users_collection.update_one(
            {"email": email.lower()},
            {"$set": {"is_verified": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        return {
            "message": "Email verified successfully. You can now login.",
            "email": email.lower(),
            "verified": True
        }
    
    async def login_user(self, email: str, password: str) -> dict:
        
        
        # Find user
        user = await self.users_collection.find_one(
            {"email": email.lower()}
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )
        
        # Verify password
        if not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )
        
        # Check email verified
        if not user.get("is_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in. Check your email for OTP: 123456"
            )
        
        # Check account active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive."
            )
        
        # Generate tokens
        access_token, refresh_token = await self.token_service.create_tokens(
            user_id=str(user["_id"])
        )
        
        # Prepare user response
        user_data = UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            bio=user.get("bio"),
            profile_picture=user.get("profile_picture"),
            is_verified=user["is_verified"],
            created_at=user["created_at"],
            is_active=user["is_active"]
        )
        
        return {
            "message": "Login successful",
            "user": user_data.model_dump(),
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
        }
    
    async def forgot_password(self, email: str) -> dict:
        
        # Check user exists
        user = await self.users_collection.find_one(
            {"email": email.lower()}
        )
        
        if not user:
            # Security: Don't reveal if email exists
            # Return success anyway to prevent email enumeration
            return {
                "message": "If email exists, OTP has been sent: 123456",
                "email": email.lower(),
                "otp_sent": True
            }
        
        # Generate OTP
        otp_code = await self.otp_service.generate_otp(
            email=email.lower(),
            purpose=OTPPurpose.PASSWORD_RESET
        )
        
        print(f"📧 Password Reset OTP for {email}: {otp_code}")
        
        return {
            "message": "OTP sent to your email for password reset: 123456",
            "email": email.lower(),
            "otp_sent": True
        }
    
    async def reset_password(self, email: str, otp_code: str, new_password: str) -> dict:
        
        await self.otp_service.verify_otp(
            email=email.lower(),
            otp_code=otp_code,
            purpose=OTPPurpose.PASSWORD_RESET
        )
        
        # Find user
        user = await self.users_collection.find_one(
            {"email": email.lower()}
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        # Update password
        result = await self.users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"hashed_password": hash_password(new_password)}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Failed to update password."
            )
        
        # Revoke all refresh tokens (security: force re-login on all devices)
        await self.token_service.revoke_all_user_tokens(str(user["_id"]))
        
        return {
            "message": "Password reset successful. Please login with new password.",
            "email": email.lower()
        }
    
    async def resend_otp(self, email: str, purpose: OTPPurpose) -> dict:
        
        
        # Generate new OTP
        otp_code = await self.otp_service.generate_otp(
            email=email.lower(),
            purpose=purpose
        )
        
        print(f"📧 Resent OTP for {email}: {otp_code}")
        
        return {
            "message": "OTP resent successfully: 123456",
            "email": email.lower(),
            "otp_sent": True
        }
    
    async def get_user_by_id(self, user_id: str) -> UserResponse:
        
        try:
            user = await self.users_collection.find_one(
                {"_id": ObjectId(user_id)}
            )
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found."
                )
            
            return UserResponse(
                id=str(user["_id"]),
                name=user["name"],
                email=user["email"],
                bio=user.get("bio"),
                profile_picture=user.get("profile_picture"),
                is_verified=user.get("is_verified", False),
                created_at=user["created_at"],
                is_active=user.get("is_active", True)
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid user ID."
            )