"""
TikTok Agent
Specialized for TikTok's short-form, trend-driven video platform
"""
from typing import Dict, List
from .base_agent import BaseAgent


class TikTokAgent(BaseAgent):
    """TikTok-specialized content generation agent"""

    def __init__(self):
        super().__init__("TikTok")

    def get_platform_guidelines(self) -> str:
        return """
        - Short, punchy, fast-paced content (15-60 seconds)
        - Trend-aware: leverage trending sounds and challenges
        - Authenticity over polish: raw, genuine content performs well
        - Hook in first 1-2 seconds is CRITICAL
        - Vertical video format only (9:16)
        - Text overlays are essential
        - Participate in trending hashtag challenges
        - Educational and entertaining content both work
        - Best posting times: 6-10 AM, 7-11 PM
        """

    def get_optimal_post_length(self) -> Dict[str, int]:
        return {
            "min_chars": 50,
            "optimal_chars": 100,
            "max_chars": 150,
            "description": "Keep captions short and punchy. 100 characters is optimal. Max is 150."
        }

    def get_hashtag_strategy(self) -> str:
        return """
        - Use 3-5 highly relevant hashtags
        - MUST include trending hashtags when relevant
        - Participate in hashtag challenges (#challenge)
        - Mix trending, niche, and branded hashtags
        - Research trending sounds and hashtags daily
        - Use #FYP, #ForYou, #ForYouPage strategically
        - Niche hashtags help algorithm categorize content
        """

    async def generate_tiktok_script(
        self,
        product_name: str,
        product_description: str,
        brand_info: Dict[str, any],
        video_style: str = "tutorial",
        duration: int = 30,
        language: str = "en",
    ) -> Dict[str, any]:
        """
        Generate TikTok video script optimized for the platform

        Args:
            product_name: Product name
            product_description: Product details
            brand_info: Brand information
            video_style: Style (tutorial, showcase, behind-the-scenes, challenge, trending)
            duration: Video duration (15, 30, or 60 seconds)
            language: Target language

        Returns:
            Dict with hook, script, text overlays, sound suggestions
        """
        prompt = f"""Create a {duration}-second TikTok video script for "{product_name}".

Product: {product_description}
Brand: {brand_info.get('name', 'AstralAI')}
Style: {video_style}
Duration: {duration} seconds
Language: {language}

CRITICAL - TikTok Formula:
1. HOOK (0-2 sec) - MUST grab attention in first 2 seconds. Use pattern interrupt!
2. VALUE/CONTENT (2-{duration-5} sec) - Deliver the main content fast-paced
3. PAYOFF (last 5 sec) - Conclusion + CTA

For each timestamp provide:
- What's happening on screen (action/visual)
- Text overlay (short, punchy text that appears on screen)
- Voiceover/caption (what's being said)
- Transition/effect suggestions
- Camera angle/movement

TikTok-specific requirements:
- Fast-paced editing (quick cuts every 2-3 seconds)
- Multiple text overlay changes
- Vertical format considerations
- Suggest trending sound that would fit
- Make it authentic and relatable, not overly polished
- Include a hook that stops the scroll

Make this optimized for TikTok's For You Page algorithm."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a viral TikTok content creator who understands TikTok's algorithm, trends, and what makes content perform well on the For You Page. You create scripts that are fast-paced, engaging, and optimized for Gen Z and Millennial audiences.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.9,  # Higher temperature for more creative TikTok content
            max_tokens=1200,
        )

        return {
            "script": response.choices[0].message.content,
            "duration": duration,
            "style": video_style,
            "platform": "TikTok",
        }

    async def generate_trending_hashtags(
        self,
        product_category: str,
        niche: str,
        include_fyp: bool = True,
    ) -> List[str]:
        """
        Generate trending TikTok hashtags

        Args:
            product_category: Product category
            niche: Specific niche
            include_fyp: Whether to include #FYP type hashtags

        Returns:
            List of hashtags optimized for TikTok
        """
        prompt = f"""Generate 5 trending TikTok hashtags for content about {product_category} in the {niche} niche.

Requirements:
- Currently trending or evergreen on TikTok
- Relevant to {product_category}
- Mix of broad and niche
- Good for algorithm discovery
{'- Include #FYP, #ForYou, or #ForYouPage' if include_fyp else '- No generic FYP hashtags'}

Return only hashtags, one per line, without # symbol."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a TikTok trend researcher who knows current trending hashtags and TikTok's algorithm.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=200,
        )

        content = response.choices[0].message.content
        hashtags = [
            line.strip().replace("#", "").strip()
            for line in content.strip().split("\n")
            if line.strip() and not line.strip().startswith("-")
        ]

        return hashtags[:5]

    async def suggest_trending_sound(
        self,
        video_theme: str,
        mood: str = "upbeat",
    ) -> Dict[str, str]:
        """
        Suggest trending sound/music for TikTok video

        Args:
            video_theme: Theme of the video
            mood: Desired mood (upbeat, dramatic, chill, etc.)

        Returns:
            Dict with sound type, mood, and description
        """
        prompt = f"""Suggest a trending TikTok sound for a video about {video_theme} with a {mood} mood.

Provide:
1. Sound Type (original trending sound, popular music, meme audio, etc.)
2. Mood Description
3. Why it works for this content
4. Alternative sound option

Be specific about current TikTok trends."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a TikTok audio expert who tracks trending sounds and knows what audio performs well for different content types.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=300,
        )

        return {
            "suggestion": response.choices[0].message.content,
            "theme": video_theme,
            "mood": mood,
        }
