"""Chat interface API endpoints"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, AsyncGenerator

from app.services.ai.content_generator import content_generator

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: dict | None = None  # Product context, brand assets, etc.


@router.post("/")
async def chat(request: ChatRequest):
    """
    Chat with AI marketing agent

    The agent can:
    - Answer questions about products
    - Generate content on-demand
    - Provide marketing advice
    - Create campaigns
    """
    # Extract last user message
    user_message = request.messages[-1].content if request.messages else ""

    # Build context-aware prompt
    system_prompt = """You are an expert AI marketing assistant for E N Trade LTD, a luxury perfume and beauty company.

Your role:
- Help create marketing content (posts, ads, videos)
- Provide marketing strategy advice
- Answer questions about digital marketing
- Assist with social media campaigns

Always be professional, creative, and focused on luxury beauty marketing.
"""

    # For MVP, use simple completion
    # In production, implement full conversation context

    response_text = f"I understand you want: {user_message}\n\n"
    response_text += "I can help you with that! Would you like me to:\n"
    response_text += "1. Generate social media posts\n"
    response_text += "2. Create ad copy\n"
    response_text += "3. Design a marketing campaign\n"
    response_text += "4. Generate product images or videos\n\n"
    response_text += "Please provide product details (name, fragrance notes) to get started!"

    return {
        "message": {
            "role": "assistant",
            "content": response_text
        }
    }


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat response"""

    async def generate_stream() -> AsyncGenerator[str, None]:
        """Generate streaming response"""
        response = "I'm your AI marketing assistant! How can I help you create amazing content today?"

        # Stream word by word
        for word in response.split():
            yield f"data: {word} \n\n"
            import asyncio
            await asyncio.sleep(0.05)

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream"
    )
