"""
Base Agent Class
All platform-specific agents inherit from this base class
"""
from typing import Dict, List, Optional
from abc import ABC, abstractmethod
from openai import AsyncOpenAI
from app.core.config import settings


class BaseAgent(ABC):
    """Base class for platform-specific content generation agents"""

    def __init__(self, platform_name: str):
        self.platform_name = platform_name
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    @abstractmethod
    def get_platform_guidelines(self) -> str:
        """Return platform-specific content guidelines"""
        pass

    @abstractmethod
    def get_optimal_post_length(self) -> Dict[str, int]:
        """Return optimal character counts for the platform"""
        pass

    @abstractmethod
    def get_hashtag_strategy(self) -> str:
        """Return hashtag best practices for the platform"""
        pass

    async def generate_post(
        self,
        product_name: str,
        product_description: str,
        brand_info: Dict[str, any],
        tone: str = "professional",
        language: str = "en",
        num_variations: int = 3,
    ) -> List[str]:
        """
        Generate platform-optimized social media posts

        Args:
            product_name: Name of the product
            product_description: Description/details about the product
            brand_info: Brand information (name, values, etc.)
            tone: Tone of voice
            language: Target language
            num_variations: Number of variations to generate

        Returns:
            List of post variations
        """
        guidelines = self.get_platform_guidelines()
        hashtag_strategy = self.get_hashtag_strategy()
        post_length = self.get_optimal_post_length()

        prompt = f"""Create {num_variations} engaging {self.platform_name} posts for a product called "{product_name}".

Product Details:
{product_description}

Brand: {brand_info.get('name', 'AstralAI')}
Brand Values: {brand_info.get('values', 'Quality, Innovation, Customer-First')}

Platform: {self.platform_name}
Guidelines: {guidelines}
Hashtag Strategy: {hashtag_strategy}
Optimal Length: {post_length}
Tone: {tone}
Language: {language}

Requirements:
- Captivating and engaging
- Highlight unique product features
- Follow {self.platform_name} best practices
- Use appropriate hashtags
- Optimized for {self.platform_name} audience
- In {language} language
- Use {tone} tone

Generate {num_variations} distinct variations that would perform well on {self.platform_name}."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert {self.platform_name} marketing specialist who creates high-performing content optimized specifically for {self.platform_name}'s algorithm and audience behavior.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=1500,
        )

        content = response.choices[0].message.content
        variations = self._parse_variations(content, num_variations)

        return variations

    def _parse_variations(self, content: str, num_variations: int) -> List[str]:
        """Parse multiple variations from AI response"""
        variations = []
        lines = content.strip().split("\n\n")

        for line in lines:
            cleaned = line.strip()
            # Remove common numbering patterns
            prefixes = [
                "1.", "2.", "3.", "4.", "5.",
                "Post 1:", "Post 2:", "Post 3:", "Post 4:", "Post 5:",
                "Variation 1:", "Variation 2:", "Variation 3:", "Variation 4:", "Variation 5:",
                "**1.", "**2.", "**3.", "**4.", "**5.",
            ]

            for prefix in prefixes:
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):].strip()
                    # Remove trailing ** if present
                    if cleaned.startswith("**"):
                        cleaned = cleaned[2:].strip()
                    break

            if cleaned and len(cleaned) > 20:
                variations.append(cleaned)

        return variations[:num_variations]
