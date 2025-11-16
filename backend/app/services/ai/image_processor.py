"""
AI Image Processing Service
Generates and edits images for marketing content
"""
from typing import Optional, Dict, List
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from io import BytesIO
import httpx
from openai import AsyncOpenAI
from app.core.config import settings


class ImageProcessor:
    """AI-powered image processing and generation service"""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_product_image(
        self,
        product_name: str,
        fragrance_notes: Dict[str, List[str]],
        style: str = "luxury",
        platform: str = "instagram",
    ) -> str:
        """
        Generate AI product image using DALL-E

        Args:
            product_name: Name of the product
            fragrance_notes: Fragrance notes dict
            style: Image style (luxury, minimalist, vibrant, elegant)
            platform: Target platform for sizing

        Returns:
            URL of generated image
        """
        # Create descriptive prompt
        notes_desc = self._notes_to_description(fragrance_notes)

        prompt = f"""A luxury perfume bottle for "{product_name}" in {style} style.
{notes_desc}

Photorealistic product photography, professional studio lighting, elegant composition,
high-end cosmetics advertisement quality, beautiful bokeh background,
{self._get_style_modifiers(style)}.

Premium beauty product photography for social media marketing."""

        # Generate with DALL-E 3
        response = await self.openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=self._get_image_size(platform),
            quality="hd",
            n=1,
        )

        return response.data[0].url

    async def add_brand_overlay(
        self,
        image_url: str,
        logo_url: Optional[str] = None,
        watermark_text: Optional[str] = None,
        brand_color: str = "#000000",
    ) -> bytes:
        """
        Add brand logo/watermark to image

        Args:
            image_url: URL of base image
            logo_url: URL of logo to overlay
            watermark_text: Text watermark to add
            brand_color: Brand color for watermark

        Returns:
            Image bytes with overlay
        """
        # Download image
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url)
            image = Image.open(BytesIO(response.content))

        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Add logo if provided
        if logo_url:
            logo_response = await client.get(logo_url)
            logo = Image.open(BytesIO(logo_response.content))

            # Resize logo to 15% of image width
            logo_width = int(image.width * 0.15)
            logo_ratio = logo.height / logo.width
            logo_height = int(logo_width * logo_ratio)
            logo = logo.resize((logo_width, logo_height), Image.LANCZOS)

            # Position in bottom right corner
            position = (
                image.width - logo_width - 30,
                image.height - logo_height - 30,
            )

            # Paste logo with transparency
            if logo.mode == "RGBA":
                image.paste(logo, position, logo)
            else:
                image.paste(logo, position)

        # Add text watermark if provided
        if watermark_text:
            draw = ImageDraw.Draw(image)

            # Try to use custom font, fall back to default
            try:
                font_size = int(image.height * 0.03)
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
            except:
                font = ImageFont.load_default()

            # Position in bottom left
            text_position = (30, image.height - 60)

            # Add text with slight shadow for readability
            shadow_offset = 2
            draw.text(
                (text_position[0] + shadow_offset, text_position[1] + shadow_offset),
                watermark_text,
                fill=(0, 0, 0, 128),
                font=font,
            )
            draw.text(text_position, watermark_text, fill=brand_color, font=font)

        # Convert to bytes
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format="PNG", quality=95)
        img_byte_arr.seek(0)

        return img_byte_arr.getvalue()

    async def create_social_post_image(
        self,
        background_image_url: str,
        text_overlay: str,
        brand_assets: Optional[Dict] = None,
        platform: str = "instagram",
    ) -> bytes:
        """
        Create social media post image with text overlay

        Args:
            background_image_url: Base image URL
            text_overlay: Text to overlay
            brand_assets: Dict with brand colors, fonts, logo
            platform: Target platform

        Returns:
            Image bytes optimized for platform
        """
        # Download background
        async with httpx.AsyncClient() as client:
            response = await client.get(background_image_url)
            image = Image.open(BytesIO(response.content))

        # Resize for platform
        target_size = self._get_platform_image_size(platform)
        image = self._resize_and_crop(image, target_size)

        # Apply subtle darkening filter for text readability
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(0.7)

        # Add gradient overlay for text area
        image = self._add_gradient_overlay(image)

        # Add text overlay
        draw = ImageDraw.Draw(image)

        # Get brand font or default
        font_size = int(image.height * 0.08)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()

        # Center text
        text_bbox = draw.textbbox((0, 0), text_overlay, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]

        position = (
            (image.width - text_width) // 2,
            (image.height - text_height) // 2,
        )

        # Draw text with outline for readability
        outline_color = (0, 0, 0)
        text_color = (255, 255, 255)

        if brand_assets and "primary_color" in brand_assets:
            text_color = self._hex_to_rgb(brand_assets["primary_color"])

        # Draw outline
        for adj_x, adj_y in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
            draw.text(
                (position[0] + adj_x, position[1] + adj_y),
                text_overlay,
                font=font,
                fill=outline_color,
            )

        # Draw main text
        draw.text(position, text_overlay, font=font, fill=text_color)

        # Add logo if provided
        if brand_assets and "logo_url" in brand_assets:
            # Similar logo addition logic as add_brand_overlay
            pass

        # Convert to bytes
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format="JPEG", quality=90, optimize=True)
        img_byte_arr.seek(0)

        return img_byte_arr.getvalue()

    async def create_video_thumbnail(
        self,
        base_image_url: str,
        title_text: str,
    ) -> bytes:
        """
        Create eye-catching video thumbnail

        Args:
            base_image_url: Base image
            title_text: Thumbnail title

        Returns:
            Thumbnail image bytes
        """
        # Download image
        async with httpx.AsyncClient() as client:
            response = await client.get(base_image_url)
            image = Image.open(BytesIO(response.content))

        # Resize to YouTube thumbnail size
        image = self._resize_and_crop(image, (1280, 720))

        # Enhance saturation and contrast for clickability
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.3)

        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)

        # Add text
        draw = ImageDraw.Draw(image)

        # Large, bold text
        font_size = 80
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()

        # Add dramatic text with shadow
        text_position = (60, image.height - 150)

        # Shadow
        draw.text(
            (text_position[0] + 4, text_position[1] + 4),
            title_text,
            font=font,
            fill=(0, 0, 0),
        )

        # Main text in white/yellow
        draw.text(text_position, title_text, font=font, fill=(255, 255, 100))

        # Convert to bytes
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format="JPEG", quality=95)
        img_byte_arr.seek(0)

        return img_byte_arr.getvalue()

    # Helper methods
    def _notes_to_description(self, notes: Dict[str, List[str]]) -> str:
        """Convert fragrance notes to visual description"""
        descriptions = []

        # Map notes to visual elements
        visual_map = {
            "rose": "soft pink petals",
            "jasmine": "white delicate flowers",
            "vanilla": "warm amber tones",
            "sandalwood": "rich woody textures",
            "bergamot": "citrus brightness",
            "musk": "elegant sophistication",
        }

        for note_category in ["top", "middle", "base"]:
            if note_category in notes:
                for note in notes[note_category]:
                    note_lower = note.lower()
                    for key, visual in visual_map.items():
                        if key in note_lower:
                            descriptions.append(visual)

        if descriptions:
            return f"Visual elements: {', '.join(descriptions[:3])}"
        return ""

    def _get_style_modifiers(self, style: str) -> str:
        """Get style-specific modifiers for prompt"""
        modifiers = {
            "luxury": "gold accents, marble surface, dramatic lighting",
            "minimalist": "clean white background, soft shadows, simple composition",
            "vibrant": "colorful background, dynamic composition, bold lighting",
            "elegant": "soft lighting, silk fabric, refined composition",
        }
        return modifiers.get(style, "professional styling")

    def _get_image_size(self, platform: str) -> str:
        """Get optimal DALL-E image size for platform"""
        # DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
        platform_sizes = {
            "instagram": "1024x1024",  # Square post
            "facebook": "1024x1024",
            "tiktok": "1024x1792",  # Vertical
            "youtube": "1792x1024",  # Horizontal
        }
        return platform_sizes.get(platform, "1024x1024")

    def _get_platform_image_size(self, platform: str) -> tuple:
        """Get exact pixel dimensions for platform"""
        sizes = {
            "instagram": (1080, 1080),
            "instagram_story": (1080, 1920),
            "facebook": (1200, 630),
            "tiktok": (1080, 1920),
            "youtube": (1280, 720),
        }
        return sizes.get(platform, (1080, 1080))

    def _resize_and_crop(self, image: Image.Image, target_size: tuple) -> Image.Image:
        """Resize and crop image to exact dimensions"""
        # Calculate aspect ratios
        img_ratio = image.width / image.height
        target_ratio = target_size[0] / target_size[1]

        if img_ratio > target_ratio:
            # Image is wider, crop width
            new_width = int(image.height * target_ratio)
            left = (image.width - new_width) // 2
            image = image.crop((left, 0, left + new_width, image.height))
        else:
            # Image is taller, crop height
            new_height = int(image.width / target_ratio)
            top = (image.height - new_height) // 2
            image = image.crop((0, top, image.width, top + new_height))

        # Resize to target
        return image.resize(target_size, Image.LANCZOS)

    def _add_gradient_overlay(self, image: Image.Image) -> Image.Image:
        """Add gradient overlay for text readability"""
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Create gradient from bottom
        for y in range(image.height // 2, image.height):
            alpha = int(((y - image.height // 2) / (image.height // 2)) * 180)
            draw.rectangle(
                [(0, y), (image.width, y + 1)],
                fill=(0, 0, 0, alpha),
            )

        # Composite
        image = image.convert("RGBA")
        image = Image.alpha_composite(image, overlay)
        return image.convert("RGB")

    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


# Singleton instance
image_processor = ImageProcessor()
