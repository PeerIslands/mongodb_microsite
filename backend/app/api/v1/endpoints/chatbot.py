"""
Chatbot API Endpoints

Provides AI-powered chatbot functionality with adaptive RAG.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from app.core.database import get_database
from app.api.v1.services.chatbot_service import ChatbotService

router = APIRouter()


class ChatMessage(BaseModel):
    """Individual chat message."""
    role: str = Field(..., description="Message role (user/assistant)")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Chat request payload."""
    question: str = Field(
        ..., 
        description="User question", 
        min_length=1, 
        max_length=500,
        examples=["What accelerators do you offer?"]
    )
    search_depth: int = Field(
        default=20,
        description="Search depth: 20 (Tier 2), 40 (Tier 3), 100+ (Maximum)",
        ge=10,
        le=100
    )
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=None, 
        description="Previous conversation messages"
    )


class ChatResponse(BaseModel):
    """Chat response payload."""
    response: str = Field(..., description="AI assistant response")
    success: bool = Field(..., description="Whether the request was successful")
    tier_used: str = Field(..., description="RAG tier used (tier1/tier2/tier3)")
    confidence: float = Field(..., description="Intent detection confidence (0.0-1.0)")
    categories_searched: List[str] = Field(..., description="Categories searched")
    suggest_expand: bool = Field(..., description="Whether to suggest expanding search")
    error: Optional[str] = Field(default=None, description="Error message if any")


@router.post(
    "/chat", 
    response_model=ChatResponse, 
    summary="Chat with AI assistant",
    description="Send a question to the AI chatbot and receive an intelligent response about accelerators, case studies, events, and blogs."
)
async def chat_with_ai(
    request: ChatRequest,
    db = Depends(get_database)
):
    """
    Chat with the AI assistant.
    
    The chatbot uses a three-tiered RAG (Retrieval Augmented Generation) approach:
    - **Tier 1 (Intent-Based)**: Fast, targeted search in specific category
    - **Tier 2 (Broad Search)**: Search across all categories with limited depth
    - **Tier 3 (Deep Search)**: Expanded search with more items per category
    
    The tier is automatically selected based on question intent and search_depth parameter.
    
    **Example Questions:**
    - "What accelerators help with database migration?"
    - "Tell me about your healthcare success stories"
    - "What events are coming up?"
    - "What blogs do you have about MongoDB best practices?"
    """
    
    try:
        service = ChatbotService(db)
        
        # Convert conversation history to dict format
        history = None
        if request.conversation_history:
            history = [
                {"role": msg.role, "content": msg.content} 
                for msg in request.conversation_history
            ]
        
        # Process chat request
        result = await service.chat(
            user_question=request.question,
            search_depth=request.search_depth,
            conversation_history=history
        )
        
        return ChatResponse(**result)
    
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot error: {str(e)}"
        )


@router.get(
    "/health", 
    summary="Check chatbot service health",
    description="Verify that the chatbot service is operational and ready to handle requests."
)
async def chatbot_health():
    """
    Health check endpoint for the chatbot service.
    
    Returns basic service information and status.
    """
    return {
        "status": "healthy",
        "service": "chatbot",
        "version": "1.0.0",
        "features": [
            "intent_detection",
            "tiered_rag",
            "adaptive_search",
            "conversation_history"
        ]
    }

