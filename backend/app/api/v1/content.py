"""Content generation API endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.services.ai.content_generator import content_generator
from app.services.ai.image_processor import image_processor
from app.services.ai.video_generator import video_generator

router = APIRouter()


# Schemas
class GenerateContentRequest(BaseModel):
    product_id: int
    product_name: str
    fragrance_notes: dict
    platforms: List[str]  # ["instagram", "facebook", "tiktok"]
    languages: List[str] = ["en"]
    generate_images: bool = True
    generate_videos: bool = True
    tone: str = "professional"


class ContentVariation(BaseModel):
    text: str
    language: str
    platform: str


class GeneratedContent(BaseModel):
    social_posts: List[ContentVariation]
    ad_copies: List[dict]
    images: List[str]  # URLs
    videos: List[str]  # URLs
    video_scripts: List[dict]


@router.post("/generate", response_model=GeneratedContent)
async def generate_marketing_content(
    request: GenerateContentRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate complete marketing content package for a product

    This is the MAIN endpoint that orchestrates all AI services
    """
    result = {
        "social_posts": [],
        "ad_copies": [],
        "images": [],
        "videos": [],
        "video_scripts": [],
    }

    # 1. Generate social media posts for each platform and language
    for platform in request.platforms:
        for language in request.languages:
            posts = await content_generator.generate_social_post(
                product_name=request.product_name,
                fragrance_notes=request.fragrance_notes,
                platform=platform,
                language=language,
                tone=request.tone,
                num_variations=3,
            )

            for post in posts:
                result["social_posts"].append({
                    "text": post,
                    "language": language,
                    "platform": platform,
                })

    # 2. Generate ad copy for Google Ads and Facebook Ads
    for ad_type in ["google_search", "facebook_ad"]:
        ad_copy = await content_generator.generate_ad_copy(
            product_name=request.product_name,
            fragrance_notes=request.fragrance_notes,
            ad_type=ad_type,
            language=request.languages[0],
        )
        ad_copy["type"] = ad_type
        result["ad_copies"].append(ad_copy)

    # 3. Generate AI images if requested
    if request.generate_images:
        for platform in request.platforms[:2]:  # Limit to 2 to save costs
            try:
                image_url = await image_processor.generate_product_image(
                    product_name=request.product_name,
                    fragrance_notes=request.fragrance_notes,
                    style="luxury",
                    platform=platform,
                )
                result["images"].append(image_url)
            except Exception as e:
                print(f"Image generation error: {e}")

    # 4. Generate video scripts
    for style in ["product_showcase", "lifestyle"]:
        script = await content_generator.generate_video_script(
            product_name=request.product_name,
            fragrance_notes=request.fragrance_notes,
            duration=15,
            style=style,
            language=request.languages[0],
        )
        script["style"] = style
        result["video_scripts"].append(script)

    # 5. Generate videos if requested (limited for MVP)
    if request.generate_videos and result["images"]:
        try:
            # Generate one sample video
            video_url = await video_generator.generate_product_showcase(
                product_image_url=result["images"][0],
                product_name=request.product_name,
                script=result["video_scripts"][0] if result["video_scripts"] else {},
                duration=15,
                style="elegant",
            )
            result["videos"].append(video_url)
        except Exception as e:
            print(f"Video generation error: {e}")

    return result


@router.post("/translate")
async def translate_content(
    text: str,
    target_language: str,
):
    """Translate marketing content"""
    translated = await content_generator.translate_content(text, target_language)
    return {"original": text, "translated": translated, "language": target_language}


@router.post("/generate-image")
async def generate_image(
    product_name: str,
    fragrance_notes: dict,
    style: str = "luxury",
    platform: str = "instagram",
):
    """Generate AI product image"""
    image_url = await image_processor.generate_product_image(
        product_name=product_name,
        fragrance_notes=fragrance_notes,
        style=style,
        platform=platform,
    )

    return {"image_url": image_url}


@router.post("/generate-video")
async def generate_video(
    product_image_url: str,
    product_name: str,
    script: dict,
    duration: int = 15,
):
    """Generate marketing video"""
    video_url = await video_generator.generate_product_showcase(
        product_image_url=product_image_url,
        product_name=product_name,
        script=script,
        duration=duration,
    )

    return {"video_url": video_url}
