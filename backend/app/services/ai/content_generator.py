"""
AI Content Generation Service
Generates marketing copy, captions, and ad content
"""
from typing import List, Dict, Optional
from openai import AsyncOpenAI
import anthropic
from app.core.config import settings


class ContentGenerator:
    """AI-powered content generation service"""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.anthropic_client = (
            anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            if settings.ANTHROPIC_API_KEY
            else None
        )

    async def generate_social_post(
        self,
        product_name: str,
        fragrance_notes: Dict[str, List[str]],
        platform: str,
        language: str = "en",
        tone: str = "professional",
        num_variations: int = 3,
    ) -> List[str]:
        """
        Generate social media post variations

        Args:
            product_name: Name of the perfume
            fragrance_notes: Dict with top, middle, base notes
            platform: Social platform (facebook, instagram, tiktok, etc.)
            language: Target language code
            tone: Tone of voice (professional, casual, luxury)
            num_variations: Number of variations to generate

        Returns:
            List of post variations
        """
        # Build context from fragrance notes
        notes_text = self._format_fragrance_notes(fragrance_notes)

        # Platform-specific guidelines
        platform_guidelines = self._get_platform_guidelines(platform)

        # Create prompt
        prompt = f"""Create {num_variations} engaging {platform} posts for a perfume called "{product_name}".

Fragrance Notes:
{notes_text}

Platform: {platform}
Guidelines: {platform_guidelines}
Tone: {tone}
Language: {language}

Requirements:
- Captivating and emotional
- Highlight the unique scent profile
- Include relevant hashtags
- Optimized for {platform}
- In {language} language
- Use {tone} tone

Generate {num_variations} distinct variations."""

        # Use GPT-4 for generation
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert perfume marketing copywriter specializing in social media content for luxury beauty brands.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=1000,
        )

        # Parse variations from response
        content = response.choices[0].message.content
        variations = self._parse_variations(content, num_variations)

        return variations

    async def generate_ad_copy(
        self,
        product_name: str,
        fragrance_notes: Dict[str, List[str]],
        ad_type: str,
        target_audience: Optional[str] = None,
        language: str = "en",
    ) -> Dict[str, str]:
        """
        Generate advertisement copy

        Args:
            product_name: Name of the perfume
            fragrance_notes: Dict with fragrance notes
            ad_type: Type of ad (google_search, google_display, facebook_ad)
            target_audience: Description of target audience
            language: Target language

        Returns:
            Dict with headline, description, and call-to-action
        """
        notes_text = self._format_fragrance_notes(fragrance_notes)
        audience_text = f"Target Audience: {target_audience}" if target_audience else ""

        prompt = f"""Create compelling ad copy for a perfume called "{product_name}".

{notes_text}
{audience_text}

Ad Type: {ad_type}
Language: {language}

Generate:
1. Headline (attention-grabbing, max 30 characters)
2. Description (compelling, max 90 characters)
3. Call-to-action (actionable, max 20 characters)

Make it luxurious, desirable, and emotionally resonant."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert in creating high-converting perfume advertisements.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )

        # Parse the response into structured format
        content = response.choices[0].message.content
        return self._parse_ad_copy(content)

    async def generate_video_script(
        self,
        product_name: str,
        fragrance_notes: Dict[str, List[str]],
        duration: int = 15,
        style: str = "product_showcase",
        language: str = "en",
    ) -> Dict[str, any]:
        """
        Generate video script and scene descriptions

        Args:
            product_name: Name of the perfume
            fragrance_notes: Fragrance notes
            duration: Video duration in seconds (15, 30, 60)
            style: Video style (product_showcase, lifestyle, testimonial)
            language: Target language

        Returns:
            Dict with script, scenes, voiceover text, and visual directions
        """
        notes_text = self._format_fragrance_notes(fragrance_notes)

        prompt = f"""Create a {duration}-second video script for "{product_name}" perfume.

{notes_text}

Video Style: {style}
Duration: {duration} seconds
Language: {language}

Provide:
1. Hook (first 3 seconds - must grab attention)
2. Scene-by-scene breakdown with timestamps
3. Voiceover text for each scene
4. Visual directions (camera angles, transitions, effects)
5. Background music mood
6. Text overlays to display

Make it visually stunning and emotionally engaging."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a creative director specializing in luxury perfume video advertisements.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=1500,
        )

        content = response.choices[0].message.content
        return self._parse_video_script(content)

    async def translate_content(
        self, text: str, target_language: str
    ) -> str:
        """
        Translate content to target language while maintaining tone and emotion

        Args:
            text: Original text
            target_language: Target language code

        Returns:
            Translated text
        """
        prompt = f"""Translate the following marketing text to {target_language}.
Maintain the emotional impact, luxury tone, and persuasive elements.

Original text:
{text}

Translated text:"""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional translator specializing in luxury brand marketing.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        return response.choices[0].message.content.strip()

    # Helper methods
    def _format_fragrance_notes(self, notes: Dict[str, List[str]]) -> str:
        """Format fragrance notes as readable text"""
        parts = []
        if notes.get("top"):
            parts.append(f"Top Notes: {', '.join(notes['top'])}")
        if notes.get("middle") or notes.get("heart"):
            middle = notes.get("middle") or notes.get("heart")
            parts.append(f"Middle Notes: {', '.join(middle)}")
        if notes.get("base"):
            parts.append(f"Base Notes: {', '.join(notes['base'])}")
        return "\n".join(parts)

    def _get_platform_guidelines(self, platform: str) -> str:
        """Get platform-specific content guidelines"""
        guidelines = {
            "instagram": "Visual-first, use 3-5 hashtags, engaging first line, max 2200 chars",
            "facebook": "Conversational, storytelling, link-friendly, 40-80 chars optimal",
            "tiktok": "Short, punchy, trend-aware, use trending sounds/hashtags, max 150 chars",
            "youtube": "Detailed, keyword-rich, include timestamps, encourage engagement",
            "google_ads": "Clear value prop, include keywords, strong CTA, character limits apply",
        }
        return guidelines.get(platform.lower(), "Engaging and platform-optimized")

    def _parse_variations(self, content: str, num_variations: int) -> List[str]:
        """Parse multiple variations from AI response"""
        # Simple parsing - split by numbers or double newlines
        variations = []
        lines = content.strip().split("\n\n")

        for line in lines:
            # Remove numbering like "1.", "2.", "Post 1:", etc.
            cleaned = line.strip()
            for prefix in ["1.", "2.", "3.", "4.", "5.", "Post 1:", "Post 2:", "Post 3:", "Variation 1:", "Variation 2:", "Variation 3:"]:
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):].strip()
                    break

            if cleaned and len(cleaned) > 20:  # Filter out too-short text
                variations.append(cleaned)

        return variations[:num_variations]

    def _parse_ad_copy(self, content: str) -> Dict[str, str]:
        """Parse ad copy into structured format"""
        lines = content.strip().split("\n")
        result = {"headline": "", "description": "", "cta": ""}

        for line in lines:
            line = line.strip()
            if "headline" in line.lower() and ":" in line:
                result["headline"] = line.split(":", 1)[1].strip()
            elif "description" in line.lower() and ":" in line:
                result["description"] = line.split(":", 1)[1].strip()
            elif "call-to-action" in line.lower() or "cta" in line.lower():
                if ":" in line:
                    result["cta"] = line.split(":", 1)[1].strip()

        return result

    def _parse_video_script(self, content: str) -> Dict[str, any]:
        """Parse video script into structured format"""
        return {
            "full_script": content,
            "scenes": [],  # TODO: Parse into structured scenes
            "voiceover": "",  # TODO: Extract voiceover text
            "visual_directions": "",  # TODO: Extract visual directions
        }


# Singleton instance
content_generator = ContentGenerator()
