import re
from pydantic import BaseModel, EmailStr, Field, field_validator


# Allowed email domains
ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.co', 'live.com']


class SignupRequest(BaseModel):
    """User signup request with enhanced validation."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        """Validate email is from Gmail, Outlook, or Yahoo."""
        email_lower = v.lower()
        domain = email_lower.split('@')[-1]
        
        if domain not in ALLOWED_EMAIL_DOMAINS:
            raise ValueError(
                f"Email must be from Gmail, Outlook, or Yahoo. "
                f"Allowed domains: {', '.join(ALLOWED_EMAIL_DOMAINS)}"
            )
        return email_lower
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        Password must:
        - Be at least 8 characters
        - Contain at least one uppercase letter
        - Contain at least one lowercase letter
        - Contain at least one special character
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'`~]', v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")
        
        return v


class SignupResponse(BaseModel):
    """
    Response after successful signup.
    User must verify OTP before login.
    """
    message: str = "Signup successful. Please verify your email with OTP."
    email: EmailStr
    otp_sent: bool = True  # Static OTP, always True

class VerifyOTPRequest(BaseModel):
    """OTP verification request."""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class VerifyOTPResponse(BaseModel):
    """Response after OTP verification."""
    message: str = "Email verified successfully. You can now login."
    email: EmailStr
    verified: bool = True

class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    """Complete login response with tokens and user data."""
    message: str = "Login successful"
    user: dict
    tokens: TokenResponse

class RefreshTokenRequest(BaseModel):
    """Request to refresh access token."""
    refresh_token: str = Field(..., description="Valid refresh token")

class RefreshTokenResponse(BaseModel):
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    """Request to reset password."""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Response after password reset request."""
    message: str = "OTP sent to your email for password reset."
    email: EmailStr
    otp_sent: bool = True


class ResetPasswordRequest(BaseModel):
    """Reset password with OTP."""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        Password must:
        - Be at least 8 characters
        - Contain at least one uppercase letter
        - Contain at least one lowercase letter
        - Contain at least one special character
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'`~]', v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")
        
        return v

class ResetPasswordResponse(BaseModel):
    """Response after successful password reset."""
    message: str = "Password reset successful. Please login with new password."
    email: EmailStr

class LogoutResponse(BaseModel):
    """Response after logout."""
    message: str = "Logout successful"

class ResendOTPRequest(BaseModel):
    """Request to resend OTP."""
    email: EmailStr


class ResendOTPResponse(BaseModel):
    """Response after OTP resend."""
    message: str = "OTP resent successfully"
    email: EmailStr
    otp_sent: bool = True