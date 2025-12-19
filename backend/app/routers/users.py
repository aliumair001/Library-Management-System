
from fastapi import APIRouter, Depends, status
from app.schemas.user_schema import UserResponse, UpdateProfileRequest, UpdateProfileResponse
from app.utils.dependencies import get_current_user
from app.db.mongo import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId


router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="""
    Fetch authenticated user's profile information.
    
    """
)
async def get_current_user_profile(
    current_user: UserResponse = Depends(get_current_user)
):
    
    return current_user


@router.put(
    "/me/profile",
    response_model=UpdateProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user profile",
    description="""
    Update the current user's profile information.
    
    You can update:
    - **name**: User's display name
    - **bio**: A short biography (max 500 characters)
    - **profile_picture**: Profile picture URL or base64 encoded image
    
    Only the fields provided will be updated.
    """
)
async def update_user_profile(
    profile_data: UpdateProfileRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update user profile with optional fields."""
    
    # Build update dictionary with only provided fields
    update_fields = {}
    
    if profile_data.name is not None:
        update_fields["name"] = profile_data.name
    
    if profile_data.bio is not None:
        update_fields["bio"] = profile_data.bio
    
    if profile_data.profile_picture is not None:
        update_fields["profile_picture"] = profile_data.profile_picture
    
    # Only update if there are fields to update
    if update_fields:
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_fields}
        )
    
    # Fetch updated user
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    user_response = UserResponse(
        id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"],
        bio=updated_user.get("bio"),
        profile_picture=updated_user.get("profile_picture"),
        is_verified=updated_user.get("is_verified", False),
        created_at=updated_user["created_at"],
        is_active=updated_user.get("is_active", True)
    )
    
    return UpdateProfileResponse(
        message="Profile updated successfully",
        user=user_response
    )