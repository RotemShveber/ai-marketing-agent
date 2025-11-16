"""
AI Video Generation Service
Creates marketing videos from product images and scripts
"""
from typing import Dict, List, Optional
import httpx
from pathlib import Path
import subprocess
from io import BytesIO
from PIL import Image
from app.core.config import settings


class VideoGenerator:
    """AI-powered video generation service"""

    def __init__(self):
        self.did_api_key = settings.DID_API_KEY
        self.runway_api_key = settings.RUNWAY_API_KEY

    async def generate_product_showcase(
        self,
        product_image_url: str,
        product_name: str,
        script: Dict[str, any],
        duration: int = 15,
        style: str = "elegant",
    ) -> str:
        """
        Generate product showcase video

        Args:
            product_image_url: URL of product image
            product_name: Name of product
            script: Video script from content_generator
            duration: Duration in seconds
            style: Visual style (elegant, dynamic, minimal)

        Returns:
            URL of generated video
        """
        # For MVP, we'll use FFmpeg to create slideshow-style videos
        # In production, integrate with Runway ML or similar

        # This creates a simple video with:
        # - Product image
        # - Zoom/pan animations
        # - Text overlays
        # - Transitions

        video_path = await self._create_slideshow_video(
            product_image_url, product_name, script, duration, style
        )

        # TODO: Upload to S3 and return URL
        # For now, return local path
        return video_path

    async def generate_ai_avatar_video(
        self,
        script_text: str,
        avatar_style: str = "professional",
        language: str = "en",
    ) -> str:
        """
        Generate video with AI avatar spokesperson using D-ID

        Args:
            script_text: Text for avatar to speak
            avatar_style: Avatar appearance style
            language: Speech language

        Returns:
            URL of generated video
        """
        if not self.did_api_key:
            raise ValueError("D-ID API key not configured")

        # Call D-ID API to create avatar video
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.d-id.com/talks",
                headers={
                    "Authorization": f"Basic {self.did_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "script": {
                        "type": "text",
                        "input": script_text,
                        "provider": {
                            "type": "microsoft",
                            "voice_id": self._get_voice_for_language(language),
                        },
                    },
                    "config": {"fluent": True, "pad_audio": 0},
                    "source_url": self._get_avatar_image(avatar_style),
                },
            )

            if response.status_code == 201:
                talk_id = response.json()["id"]

                # Poll for completion
                video_url = await self._poll_did_video(talk_id, client)
                return video_url
            else:
                raise Exception(f"D-ID API error: {response.text}")

    async def generate_lifestyle_video(
        self,
        product_images: List[str],
        b_roll_theme: str,
        voiceover_text: str,
        background_music: str = "elegant",
    ) -> str:
        """
        Generate lifestyle video with multiple shots

        Args:
            product_images: List of product image URLs
            b_roll_theme: Theme for B-roll footage
            voiceover_text: Voiceover script
            background_music: Music mood

        Returns:
            URL of generated video
        """
        # This would use Runway ML or Pexels API for stock footage
        # Combined with product images and voiceover

        # For MVP, create montage-style video
        video_path = await self._create_montage_video(
            product_images, voiceover_text, background_music
        )

        return video_path

    async def add_subtitles(
        self, video_url: str, script_text: str, language: str = "en"
    ) -> str:
        """
        Add animated subtitles to video

        Args:
            video_url: URL of video
            script_text: Text to display as subtitles
            language: Subtitle language

        Returns:
            URL of video with subtitles
        """
        # Download video
        async with httpx.AsyncClient() as client:
            response = await client.get(video_url)
            video_bytes = response.content

        # TODO: Use FFmpeg to add subtitles
        # For now, return original
        return video_url

    # Helper methods
    async def _create_slideshow_video(
        self,
        image_url: str,
        product_name: str,
        script: Dict,
        duration: int,
        style: str,
    ) -> str:
        """Create slideshow-style video using FFmpeg"""
        # Download image
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url)
            image = Image.open(BytesIO(response.content))

        # Save temporarily
        temp_image_path = f"/tmp/{product_name}_temp.jpg"
        image.save(temp_image_path, "JPEG")

        # Output path
        output_path = f"/tmp/{product_name}_video.mp4"

        # Create video with zoom effect using FFmpeg
        # Zoom in effect + fade
        ffmpeg_cmd = [
            "ffmpeg",
            "-loop", "1",
            "-i", temp_image_path,
            "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0015,1.5)':d={duration * 30}:s=1920x1080",
            "-t", str(duration),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-y",
            output_path,
        ]

        try:
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
            return output_path
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return temp_image_path  # Fallback

    async def _create_montage_video(
        self, images: List[str], voiceover: str, music: str
    ) -> str:
        """Create montage from multiple images"""
        # TODO: Implement multi-image montage
        # For now, use first image
        if images:
            return await self._create_slideshow_video(
                images[0], "montage", {}, 15, "dynamic"
            )
        return ""

    async def _poll_did_video(self, talk_id: str, client: httpx.AsyncClient) -> str:
        """Poll D-ID API until video is ready"""
        import asyncio

        max_attempts = 60  # 1 minute max
        for _ in range(max_attempts):
            response = await client.get(
                f"https://api.d-id.com/talks/{talk_id}",
                headers={"Authorization": f"Basic {self.did_api_key}"},
            )

            if response.status_code == 200:
                data = response.json()
                status = data.get("status")

                if status == "done":
                    return data.get("result_url")
                elif status == "error":
                    raise Exception(f"D-ID generation failed: {data}")

            await asyncio.sleep(1)

        raise TimeoutError("Video generation timed out")

    def _get_voice_for_language(self, language: str) -> str:
        """Get appropriate voice ID for language"""
        voice_map = {
            "en": "en-US-JennyNeural",
            "es": "es-ES-ElviraNeural",
            "fr": "fr-FR-DeniseNeural",
            "de": "de-DE-KatjaNeural",
            "it": "it-IT-ElsaNeural",
            "pt": "pt-BR-FranciscaNeural",
            "he": "he-IL-HilaNeural",
        }
        return voice_map.get(language, "en-US-JennyNeural")

    def _get_avatar_image(self, style: str) -> str:
        """Get avatar image URL for style"""
        # These would be pre-selected professional avatar images
        avatars = {
            "professional": "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg",
            "casual": "https://d-id-public-bucket.s3.amazonaws.com/amy.jpg",
            "luxury": "https://d-id-public-bucket.s3.amazonaws.com/anna.jpg",
        }
        return avatars.get(style, avatars["professional"])


# Singleton instance
video_generator = VideoGenerator()
