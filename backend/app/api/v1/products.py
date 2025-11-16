"""Products API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.models.product import Product
from pydantic import BaseModel

router = APIRouter()


# Schemas
class ProductCreate(BaseModel):
    name: str
    category: str = "Perfume"
    description: str | None = None
    fragrance_notes: dict | None = None
    scent_family: str | None = None
    price: str | None = None
    tags: list[str] | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str | None
    fragrance_notes: dict | None
    primary_image_url: str | None
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new product"""
    # TODO: Add user authentication
    db_product = Product(
        user_id=1,  # Temporary
        **product.model_dump(),
    )

    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)

    return db_product


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """List all products"""
    from sqlalchemy import select

    result = await db.execute(
        select(Product).offset(skip).limit(limit)
    )
    products = result.scalars().all()

    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get product by ID"""
    from sqlalchemy import select

    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.post("/{product_id}/upload-image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload product image"""
    # TODO: Upload to S3/R2 and update product
    # For now, return placeholder
    return {
        "message": "Image uploaded successfully",
        "url": f"https://placeholder.com/product_{product_id}.jpg",
    }
