"""Social media integration API endpoints"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class PostToSocialRequest(BaseModel):
    platform: str  # facebook, instagram, tiktok
    content_id: int
    caption: str
    media_url: str
    schedule_time: str | None = None


@router.post("/connect/{platform}")
async def connect_social_account(platform: str, access_token: str):
    """Connect a social media account"""
    # TODO: Implement OAuth flow and store tokens
    return {
        "message": f"Connected to {platform} successfully",
        "platform": platform,
    }


@router.post("/post")
async def post_to_social(request: PostToSocialRequest):
    """Post content to social media"""
    # TODO: Implement actual posting via platform APIs
    return {
        "message": f"Posted to {request.platform} successfully",
        "post_id": "mock_post_123",
        "url": f"https://{request.platform}.com/post/mock_post_123",
    }


@router.get("/accounts")
async def list_connected_accounts():
    """List all connected social accounts"""
    # TODO: Query database for connected accounts
    return {
        "accounts": [
            {"platform": "facebook", "account_name": "E N Trade LTD", "is_active": True},
            {"platform": "instagram", "account_name": "@entradeltd", "is_active": True},
        ]
    }
