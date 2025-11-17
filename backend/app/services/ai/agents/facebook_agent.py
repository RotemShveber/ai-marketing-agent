"""
Facebook Agent
Specialized for Facebook's platform-specific content requirements
"""
from typing import Dict
from .base_agent import BaseAgent


class FacebookAgent(BaseAgent):
    """Facebook-specialized content generation agent"""

    def __init__(self):
        super().__init__("Facebook")

    def get_platform_guidelines(self) -> str:
        return """
        - Storytelling and emotional connection work best
        - Longer posts (40-80 words) perform well
        - Questions and polls drive engagement
        - Links are native and work well
        - Use conversational, authentic tone
        - Personal stories resonate with audience
        - Video posts get 59% more engagement
        - Best posting times: 1-4 PM weekdays
        """

    def get_optimal_post_length(self) -> Dict[str, int]:
        return {
            "min_chars": 40,
            "optimal_chars": 80,
            "max_chars": 500,
            "description": "40-80 characters for headlines, up to 500 for detailed posts"
        }

    def get_hashtag_strategy(self) -> str:
        return """
        - Use 1-3 hashtags maximum (Facebook is not hashtag-heavy)
        - Hashtags are less important than on other platforms
        - Focus on branded hashtags
        - Hashtags should be integrated naturally in text
        - Don't clutter posts with hashtags
        """

    async def generate_ad_copy(
        self,
        product_name: str,
        product_description: str,
        brand_info: Dict[str, any],
        objective: str = "conversions",
        language: str = "en",
    ) -> Dict[str, str]:
        """
        Generate Facebook ad copy optimized for Facebook Ads Manager

        Args:
            product_name: Product name
            product_description: Product details
            brand_info: Brand information
            objective: Ad objective (awareness, consideration, conversions)
            language: Target language

        Returns:
            Dict with primary text, headline, description, and CTA
        """
        prompt = f"""Create compelling Facebook ad copy for "{product_name}".

Product: {product_description}
Brand: {brand_info.get('name', 'AstralAI')}
Objective: {objective}
Language: {language}

Generate optimized Facebook ad components:
1. Primary Text (125 characters max) - Main ad copy that appears above image
2. Headline (40 characters max) - Attention-grabbing headline
3. Description (30 characters max) - Supporting description
4. Call-to-Action - One word action (Shop Now, Learn More, Sign Up, etc.)

Make it compelling, benefit-focused, and optimized for {objective} objective."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a Facebook Ads expert who creates high-converting ad copy following Facebook's best practices and character limits.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )

        content = response.choices[0].message.content
        return self._parse_ad_copy(content)

    def _parse_ad_copy(self, content: str) -> Dict[str, str]:
        """Parse ad copy into structured format"""
        lines = content.strip().split("\n")
        result = {
            "primary_text": "",
            "headline": "",
            "description": "",
            "cta": "Shop Now"
        }

        for line in lines:
            line = line.strip()
            lower = line.lower()

            if "primary text" in lower and ":" in line:
                result["primary_text"] = line.split(":", 1)[1].strip()
            elif "headline" in lower and ":" in line:
                result["headline"] = line.split(":", 1)[1].strip()
            elif "description" in lower and ":" in line:
                result["description"] = line.split(":", 1)[1].strip()
            elif "call-to-action" in lower or "cta" in lower:
                if ":" in line:
                    result["cta"] = line.split(":", 1)[1].strip()

        return result
