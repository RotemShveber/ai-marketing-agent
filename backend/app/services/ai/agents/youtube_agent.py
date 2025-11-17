"""
YouTube Agent
Specialized for YouTube's long-form video platform with SEO focus
"""
from typing import Dict, List
from .base_agent import BaseAgent


class YouTubeAgent(BaseAgent):
    """YouTube-specialized content generation agent"""

    def __init__(self):
        super().__init__("YouTube")

    def get_platform_guidelines(self) -> str:
        return """
        - Long-form content (8-15 minutes optimal for monetization)
        - SEO is CRITICAL: titles, descriptions, tags matter
        - Thumbnail and title work together to drive clicks
        - First 15 seconds determine watch time
        - Include timestamps for longer videos
        - Encourage likes, comments, subscriptions
        - End screens and cards boost engagement
        - Consistency in posting schedule matters
        - Best posting times: 2-4 PM weekdays
        """

    def get_optimal_post_length(self) -> Dict[str, int]:
        return {
            "title_chars": 60,
            "description_min": 200,
            "description_optimal": 500,
            "description_max": 5000,
            "description": "Title: 60 chars for full display. Description: 200-500 chars minimum, can go to 5,000."
        }

    def get_hashtag_strategy(self) -> str:
        return """
        - Use 3-5 hashtags in description
        - First 3 hashtags appear above title
        - Focus on searchable, relevant hashtags
        - Mix branded and general hashtags
        - Hashtags less important than SEO keywords
        - Don't overuse - quality over quantity
        """

    async def generate_video_script(
        self,
        product_name: str,
        product_description: str,
        brand_info: Dict[str, any],
        video_type: str = "product_review",
        duration_minutes: int = 10,
        language: str = "en",
    ) -> Dict[str, any]:
        """
        Generate YouTube video script with timestamps

        Args:
            product_name: Product name
            product_description: Product details
            brand_info: Brand information
            video_type: Type (product_review, tutorial, unboxing, comparison, etc.)
            duration_minutes: Video duration in minutes
            language: Target language

        Returns:
            Dict with full script, timestamps, sections
        """
        prompt = f"""Create a {duration_minutes}-minute YouTube video script for "{product_name}".

Product: {product_description}
Brand: {brand_info.get('name', 'AstralAI')}
Video Type: {video_type}
Duration: {duration_minutes} minutes
Language: {language}

Structure the video with:

1. HOOK (0:00-0:15) - Grab attention in first 15 seconds
2. INTRO (0:15-1:00) - Introduce topic, what viewers will learn
3. MAIN CONTENT ({duration_minutes - 2} minutes) - Break into clear sections with timestamps
4. CONCLUSION (last 1 min) - Recap key points
5. CTA (last 30 sec) - Subscribe, like, comment, visit link

For each section provide:
- Timestamp (MM:SS format)
- Section title
- Talking points/script
- B-roll suggestions (what to show on screen)
- Graphics/text overlay suggestions
- Transition notes

YouTube-specific requirements:
- SEO keyword integration
- Natural product placement
- Encourage engagement (ask questions)
- Mention subscribe/like at key moments
- Include pattern interrupt every 2-3 minutes
- Make intro compelling to reduce bounce rate

Write a detailed, engaging script optimized for YouTube's algorithm and viewer retention."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional YouTube content creator and scriptwriter who understands YouTube's algorithm, SEO, and viewer retention strategies. You create engaging, well-structured video scripts.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2500,
        )

        return {
            "script": response.choices[0].message.content,
            "duration_minutes": duration_minutes,
            "video_type": video_type,
            "platform": "YouTube",
        }

    async def generate_seo_metadata(
        self,
        product_name: str,
        product_description: str,
        video_topic: str,
        target_keywords: List[str],
        language: str = "en",
    ) -> Dict[str, any]:
        """
        Generate SEO-optimized YouTube metadata

        Args:
            product_name: Product name
            product_description: Product details
            video_topic: Main video topic
            target_keywords: Target SEO keywords
            language: Target language

        Returns:
            Dict with title, description, tags, and thumbnail suggestions
        """
        keywords_text = ", ".join(target_keywords)

        prompt = f"""Create SEO-optimized YouTube metadata for a video about "{product_name}".

Product: {product_description}
Video Topic: {video_topic}
Target Keywords: {keywords_text}
Language: {language}

Generate:

1. TITLE (60 characters max)
   - Include primary keyword
   - Compelling and click-worthy
   - Clear value proposition

2. DESCRIPTION (at least 300 words)
   - First 2-3 lines are critical (appear above "Show More")
   - Include all target keywords naturally
   - Add timestamps (create 5-7 timestamp sections)
   - Include links section
   - Add relevant hashtags (3-5)
   - Social media links section
   - Disclosure/disclaimer if needed

3. TAGS (20-25 tags)
   - Primary keywords first
   - Mix of broad and specific
   - Include brand name
   - Competitor keywords if relevant
   - Long-tail keyword variations

4. THUMBNAIL TEXT (3-5 words max)
   - Short, punchy text for thumbnail
   - Complements title
   - High contrast words

Make everything SEO-optimized for YouTube search and recommendations."""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a YouTube SEO expert who knows how to optimize videos for search, recommendations, and maximum discoverability.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            max_tokens=1500,
        )

        content = response.choices[0].message.content
        return self._parse_seo_metadata(content)

    def _parse_seo_metadata(self, content: str) -> Dict[str, any]:
        """Parse SEO metadata from AI response"""
        result = {
            "title": "",
            "description": "",
            "tags": [],
            "thumbnail_text": "",
        }

        current_section = None
        lines = content.strip().split("\n")

        for line in lines:
            line_lower = line.lower().strip()

            if "title" in line_lower and ":" in line:
                current_section = "title"
                result["title"] = line.split(":", 1)[1].strip()
            elif "description" in line_lower and ":" in line:
                current_section = "description"
            elif "tags" in line_lower and ":" in line:
                current_section = "tags"
            elif "thumbnail" in line_lower and ":" in line:
                current_section = "thumbnail_text"
                result["thumbnail_text"] = line.split(":", 1)[1].strip()
            elif current_section == "description" and line.strip():
                result["description"] += line.strip() + "\n"
            elif current_section == "tags" and line.strip():
                # Extract tags from comma-separated or line-separated format
                tags = [t.strip() for t in line.replace(",", " ").split() if t.strip()]
                result["tags"].extend(tags)

        # Clean up tags (remove duplicates, clean formatting)
        result["tags"] = list(set([
            tag.strip().replace("#", "").replace("-", "").strip()
            for tag in result["tags"]
            if tag.strip() and len(tag.strip()) > 2
        ]))[:25]

        result["description"] = result["description"].strip()

        return result
