"""
Platform-Specific AI Agents
Each agent is optimized for a specific social media platform
"""
from .base_agent import BaseAgent
from .facebook_agent import FacebookAgent
from .instagram_agent import InstagramAgent
from .tiktok_agent import TikTokAgent
from .youtube_agent import YouTubeAgent
from .google_ads_agent import GoogleAdsAgent

__all__ = [
    "BaseAgent",
    "FacebookAgent",
    "InstagramAgent",
    "TikTokAgent",
    "YouTubeAgent",
    "GoogleAdsAgent",
]
