"""API v1 router"""
from fastapi import APIRouter

from app.api.v1 import products, content, chat, social, analytics, brand

router = APIRouter()

# Include all endpoint routers
router.include_router(products.router, prefix="/products", tags=["Products"])
router.include_router(content.router, prefix="/content", tags=["Content"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
router.include_router(social.router, prefix="/social", tags=["Social Media"])
router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
router.include_router(brand.router, prefix="/brand", tags=["Brand"])
