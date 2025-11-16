"""Brand assets API endpoints"""
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

router = APIRouter()


class BrandAssetsUpdate(BaseModel):
    brand_name: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    tone_of_voice: str | None = None
    brand_keywords: list[str] | None = None


@router.get("/")
async def get_brand_assets():
    """Get brand assets and style guide"""
    # TODO: Query from database
    return {
        "brand_name": "E N Trade LTD",
        "tagline": "Luxury Perfumes & Beauty",
        "logo_url": None,
        "primary_color": "#000000",
        "secondary_color": "#FFFFFF",
        "accent_color": "#D4AF37",  # Gold
        "tone_of_voice": "luxury",
        "brand_keywords": ["luxury", "elegant", "sophisticated", "timeless"],
    }


@router.put("/")
async def update_brand_assets(assets: BrandAssetsUpdate):
    """Update brand assets"""
    # TODO: Save to database
    return {"message": "Brand assets updated successfully", "assets": assets}


@router.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    """Upload brand logo"""
    # TODO: Upload to S3 and save URL
    return {
        "message": "Logo uploaded successfully",
        "url": "https://placeholder.com/logo.png",
    }
