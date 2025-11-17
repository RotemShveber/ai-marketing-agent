"""
Google Ads Agent
Specialized for Google Ads campaigns (Search, Display, Shopping)
"""
from typing import Dict, List
from .base_agent import BaseAgent


class GoogleAdsAgent(BaseAgent):
    """Google Ads-specialized content generation agent"""

    def __init__(self):
        super().__init__("Google Ads")

    def get_platform_guidelines(self) -> str:
        return """
        - Keyword relevance is critical for Quality Score
        - Clear value proposition in headlines
        - Strong call-to-action required
        - Ad extensions increase CTR significantly
        - Match ad copy to landing page content
        - Use dynamic keyword insertion when relevant
        - Character limits are strict - follow them
        - A/B test different ad variations
        - Focus on benefits, not just features
        """

    def get_optimal_post_length(self) -> Dict[str, int]:
        return {
            "headline1": 30,
            "headline2": 30,
            "headline3": 30,
            "description1": 90,
            "description2": 90,
            "description": "Headlines: 30 chars each (3 total). Descriptions: 90 chars each (2 total)."
        }

    def get_hashtag_strategy(self) -> str:
        return "Not applicable for Google Ads - focus on keywords instead of hashtags."

    async def generate_search_ad(
        self,
        product_name: str,
        product_description: str,
        brand_info: Dict[str, any],
        target_keywords: List[str],
        ad_goal: str = "conversions",
        language: str = "en",
    ) -> Dict[str, any]:
        """
        Generate Google Search Ad copy

        Args:
            product_name: Product name
            product_description: Product details
            brand_info: Brand information
            target_keywords: Target keywords for the ad
            ad_goal: Campaign goal (awareness, consideration, conversions)
            language: Target language

        Returns:
            Dict with multiple headlines, descriptions, and extensions
        """
        keywords_text = ", ".join(target_keywords)

        prompt = f"""Create Google Search Ad copy for "{product_name}".

Product: {product_description}
Brand: {brand_info.get('name', 'AstralAI')}
Target Keywords: {keywords_text}
Campaign Goal: {ad_goal}
Language: {language}

Generate a complete Responsive Search Ad:

1. HEADLINES (15 headlines, 30 characters max each)
   - Include primary keywords
   - Clear value propositions
   - Different angles/benefits
   - Include brand name in at least 2
   - Use numbers/specifics when possible

2. DESCRIPTIONS (4 descriptions, 90 characters max each)
   - Expand on benefits
   - Include call-to-action
   - Address pain points
   - Mention unique selling points

3. SITE LINK EXTENSIONS (4 sitelinks)
   - Title (25 chars)
   - Description (35 chars)

4. CALLOUT EXTENSIONS (6-8 callouts, 25 chars each)
   - Brief benefit statements
   - Trust signals
   - Unique features

5. STRUCTURED SNIPPETS
   - Header category
   - 4-6 values

CRITICAL: Follow character limits exactly. Make copy compelling and keyword-relevant for high Quality Score."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a Google Ads expert who creates high-performing search ads with optimal Quality Scores. You understand keyword relevance, ad rank, and conversion optimization.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        content = response.choices[0].message.content
        return self._parse_search_ad(content)

    async def generate_display_ad(
        self,
        product_name: str,
        product_description: str,
        brand_info: Dict[str, any],
        audience: str = "general",
        ad_format: str = "responsive",
        language: str = "en",
    ) -> Dict[str, any]:
        """
        Generate Google Display Ad copy

        Args:
            product_name: Product name
            product_description: Product details
            brand_info: Brand information
            audience: Target audience description
            ad_format: Display ad format (responsive, image, etc.)
            language: Target language

        Returns:
            Dict with headlines, descriptions, and image suggestions
        """
        prompt = f"""Create Google Display Ad copy for "{product_name}".

Product: {product_description}
Brand: {brand_info.get('name', 'AstralAI')}
Target Audience: {audience}
Ad Format: {ad_format}
Language: {language}

Generate Responsive Display Ad components:

1. SHORT HEADLINE (30 characters max)
   - Punchy and attention-grabbing

2. LONG HEADLINE (90 characters max)
   - More descriptive
   - Include key benefit

3. DESCRIPTION (90 characters max)
   - Compelling copy
   - Clear value proposition

4. BUSINESS NAME
   - {brand_info.get('name', 'AstralAI')}

5. CALL TO ACTION
   - One of: Learn More, Shop Now, Get Started, Sign Up, Contact Us

6. IMAGE SUGGESTIONS (for 3 different ad sizes)
   - Square (1:1): What to show
   - Landscape (1.91:1): What to show
   - Portrait (4:5): What to show
   - Image mood and style

Make it visually appealing and optimized for display network."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a Google Display Ads specialist who creates compelling visual ad campaigns that drive awareness and conversions.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=800,
        )

        content = response.choices[0].message.content
        return self._parse_display_ad(content)

    async def generate_shopping_ad_title(
        self,
        product_name: str,
        product_attributes: Dict[str, str],
        brand_name: str,
        language: str = "en",
    ) -> str:
        """
        Generate optimized Google Shopping ad title

        Args:
            product_name: Product name
            product_attributes: Product attributes (size, color, etc.)
            brand_name: Brand name
            language: Target language

        Returns:
            Optimized product title (150 chars max)
        """
        attributes_text = ", ".join([f"{k}: {v}" for k, v in product_attributes.items()])

        prompt = f"""Create an optimized Google Shopping product title.

Product: {product_name}
Attributes: {attributes_text}
Brand: {brand_name}
Language: {language}

Requirements:
- Maximum 150 characters
- Front-load important information
- Include: Brand + Product Type + Key Attributes
- Format: Brand - Product Type - Key Details
- Be specific and descriptive
- Include searchable keywords
- Follow Google Shopping best practices

Generate ONE optimized title."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a Google Shopping expert who optimizes product titles for maximum visibility and CTR in Google Shopping results.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=100,
        )

        return response.choices[0].message.content.strip()

    def _parse_search_ad(self, content: str) -> Dict[str, any]:
        """Parse search ad components"""
        result = {
            "headlines": [],
            "descriptions": [],
            "sitelinks": [],
            "callouts": [],
            "structured_snippets": {},
        }

        current_section = None
        lines = content.strip().split("\n")

        for line in lines:
            line_stripped = line.strip()
            line_lower = line_stripped.lower()

            if "headline" in line_lower and not line_lower.startswith("-"):
                current_section = "headlines"
            elif "description" in line_lower and not line_lower.startswith("-"):
                current_section = "descriptions"
            elif "sitelink" in line_lower:
                current_section = "sitelinks"
            elif "callout" in line_lower:
                current_section = "callouts"
            elif "structured snippet" in line_lower:
                current_section = "structured_snippets"
            elif line_stripped and current_section:
                # Clean the line
                cleaned = line_stripped.lstrip("-•*123456789. ").strip()
                if cleaned and len(cleaned) > 3:
                    if current_section in ["headlines", "descriptions", "callouts"]:
                        result[current_section].append(cleaned)

        return result

    def _parse_display_ad(self, content: str) -> Dict[str, any]:
        """Parse display ad components"""
        result = {
            "short_headline": "",
            "long_headline": "",
            "description": "",
            "cta": "Learn More",
            "image_suggestions": {},
        }

        lines = content.strip().split("\n")

        for line in lines:
            line_stripped = line.strip()
            line_lower = line_stripped.lower()

            if "short headline" in line_lower and ":" in line:
                result["short_headline"] = line.split(":", 1)[1].strip()
            elif "long headline" in line_lower and ":" in line:
                result["long_headline"] = line.split(":", 1)[1].strip()
            elif "description" in line_lower and ":" in line and "image" not in line_lower:
                result["description"] = line.split(":", 1)[1].strip()
            elif "call to action" in line_lower or "cta" in line_lower:
                if ":" in line:
                    result["cta"] = line.split(":", 1)[1].strip()

        return result
