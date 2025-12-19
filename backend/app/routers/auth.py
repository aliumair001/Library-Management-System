from fastapi import APIRouter, Depends, status
from app.services.auth_service import AuthService
from app.services.token_service import TokenService
from app.models.otp_model import OTPPurpose
from app.schemas.auth_schema import (
    SignupRequest,
    SignupResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    LogoutResponse,
    ResendOTPRequest,
    ResendOTPResponse
)
from app.utils.dependencies import get_auth_service, get_token_service


router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User signup",
    description="""
    Register new user account.
    """
)
async def signup(
    signup_data: SignupRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Create new user account and send OTP."""
    return await auth_service.signup_user(
        name=signup_data.name,
        email=signup_data.email,
        password=signup_data.password
    )


@router.post(
    "/verify-otp",
    response_model=VerifyOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify OTP",
    description="""
    Verify email with OTP code.
    
        """
)
async def verify_otp(
    verify_data: VerifyOTPRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Verify email with OTP."""
    return await auth_service.verify_email(
        email=verify_data.email,
        otp_code=verify_data.otp_code
    )


@router.post(
    "/resend-otp",
    response_model=ResendOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend OTP",
    description="""
    Resend OTP for email verification.
    
        """
)
async def resend_otp(
    resend_data: ResendOTPRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Resend OTP for email verification."""
    return await auth_service.resend_otp(
        email=resend_data.email,
        purpose=OTPPurpose.EMAIL_VERIFICATION
    )

@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="""
    Authenticate user and return JWT tokens.
    
    """
)
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Authenticate user and return JWT tokens."""
    return await auth_service.login_user(
        email=login_data.email,
        password=login_data.password
    )
@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="""
    Get new access token using refresh token.
    
        """
)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    token_service: TokenService = Depends(get_token_service)
):
    """Refresh access token using refresh token."""
    new_access_token, new_refresh_token = await token_service.refresh_access_token(
        refresh_token=refresh_data.refresh_token
    )
    
    return RefreshTokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )
@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="""
    Revoke refresh token (logout).
    
    """
)
async def logout(
    refresh_data: RefreshTokenRequest,
    token_service: TokenService = Depends(get_token_service)
):
    """Logout user by revoking refresh token."""
    await token_service.revoke_token(refresh_data.refresh_token)
    
    return LogoutResponse(
        message="Logout successful. All tokens revoked."
    )
@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Forgot password",
    description="""
    Initiate password reset flow.


           """
)
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Send OTP for password reset."""
    return await auth_service.forgot_password(
        email=forgot_data.email
    )


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password",
    description="""
    Reset password using OTP.
    
        """
)
async def reset_password(
    reset_data: ResetPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Reset password with OTP."""
    return await auth_service.reset_password(
        email=reset_data.email,
        otp_code=reset_data.otp_code,
        new_password=reset_data.new_password
    )