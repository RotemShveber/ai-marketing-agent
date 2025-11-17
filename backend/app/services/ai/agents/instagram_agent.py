"""
Instagram Agent
Specialized for Instagram's visual-first, hashtag-heavy platform
"""
from typing import Dict, List
from .base_agent import BaseAgent


class InstagramAgent(BaseAgent):
    """Instagram-specialized content generation agent"""

    def __init__(self):
        super().__init__("Instagram")

    def get_platform_guidelines(self) -> str:
        return """
        - Visual-first platform: images/videos are primary
        - First line is crucial (visible without "more")
        - Strong emphasis on hashtags (use 20-30)
        - Storytelling through carousel posts works well
        - User-generated content drives engagement
        - Instagram Stories and Reels are key formats
        - Aesthetic consistency is important
        - Best posting times: 11 AM - 1 PM weekdays
        """

    def get_optimal_post_length(self) -> Dict[str, int]:
        return {
            "min_chars": 100,
            "optimal_chars": 138,
            "max_chars": 2200,
            "first_line_chars": 125,
            "description": "First 125 chars visible without clicking 'more'. Keep captions concise but can go up to 2,200."
        }

    def get_hashtag_strategy(self) -> str:
        return """
        - Use 20-30 hashtags for maximum reach
        - Mix of popular, moderately popular, and niche hashtags
        - Place hashtags at the end or in first comment
        - Use branded hashtags for campaigns
        - Research trending hashtags in your niche
        - Combine broad and specific hashtags
        - Avoid banned/broken hashtags
        - Create a custom branded hashtag
        """

    async def generate_hashtags(
        self,
        product_name: str,
        product_category: str,
        brand_name: str,
        target_audience: str = "general",
        num_hashtags: int = 30,
    ) -> List[str]:
        """
        Generate optimized Instagram hashtags

        Args:
            product_name: Product name
            product_category: Product category
            brand_name: Brand name
            target_audience: Target audience description
            num_hashtags: Number of hashtags to generate (default 30)

        Returns:
            List of hashtags (without # symbol)
        """
        prompt = f"""Generate {num_hashtags} Instagram hashtags for a product called "{product_name}".

Product Category: {product_category}
Brand: {brand_name}
Target Audience: {target_audience}

Generate a strategic mix of:
- 3-5 branded hashtags (brand-specific)
- 5-10 popular hashtags (100k-1M posts)
- 10-15 moderately popular hashtags (10k-100k posts)
- 5-10 niche hashtags (<10k posts)

Requirements:
- Highly relevant to the product
- Mix of broad and specific
- Trending in the industry
- Good for discovery
- No banned hashtags
- No spaces or special characters

Return only the hashtags, one per line, without the # symbol."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are an Instagram hashtag research expert who understands hashtag strategy and Instagram's algorithm.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )

        content = response.choices[0].message.content
        hashtags = [
            line.strip().replace("#", "").strip()
            for line in content.strip().split("\n")
            if line.strip() and not line.strip().startswith("-")
        ]

        return hashtags[:num_hashtags]

    async def generate_reel_script(
        self,
        product_name: str,
        product_description: str,
        brand_info: Dict[str, any],
        duration: int = 15,
        hook_style: str = "question",
        language: str = "en",
    ) -> Dict[str, any]:
        """
        Generate Instagram Reel script

        Args:
            product_name: Product name
            product_description: Product details
            brand_info: Brand information
            duration: Video duration (15, 30, or 60 seconds)
            hook_style: Opening hook style (question, statement, statistic, etc.)
            language: Target language

        Returns:
            Dict with hook, scenes, text overlays, audio suggestions
        """
        prompt = f"""Create a {duration}-second Instagram Reel script for "{product_name}".

Product: {product_description}
Brand: {brand_info.get('name', 'AstralAI')}
Hook Style: {hook_style}
Duration: {duration} seconds
Language: {language}

Structure the Reel:
1. HOOK (0-3 seconds) - Grab attention immediately using {hook_style} style
2. PROBLEM/CONTEXT (3-8 seconds) - Set up the scenario
3. SOLUTION/PRODUCT (8-{duration-3} seconds) - Show the product
4. CTA ({duration-3}-{duration} seconds) - Call to action

For each section provide:
- Timestamp
- Visual direction (what's on screen)
- Text overlay (short, punchy text)
- Voiceover/Audio suggestion
- Transition effect

Make it fast-paced, engaging, and optimized for Instagram Reels algorithm."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are an Instagram Reels expert who creates viral short-form video scripts optimized for Instagram's algorithm.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=1000,
        )

        return {
            "script": response.choices[0].message.content,
            "duration": duration,
            "platform": "Instagram Reels",
        }
