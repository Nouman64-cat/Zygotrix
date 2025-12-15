"""Prompt template model for storing chatbot system prompts."""
from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class PromptTemplate(BaseModel):
    """Model for chatbot prompt templates."""

    prompt_type: Literal["system", "simulation", "system_verbose"] = Field(
        ..., description="Type of prompt template"
    )
    prompt_content: str = Field(..., description="The actual prompt content")
    description: Optional[str] = Field(None, description="Description of this prompt")
    is_active: bool = Field(True, description="Whether this prompt is currently active")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    updated_by: Optional[str] = Field(None, description="User ID who last updated this")

    class Config:
        json_schema_extra = {
            "example": {
                "prompt_type": "system",
                "prompt_content": "You are a helpful genetics assistant...",
                "description": "Main system prompt for the chatbot",
                "is_active": True,
                "updated_by": "admin-123"
            }
        }


class PromptTemplateUpdate(BaseModel):
    """Model for updating prompt templates."""

    prompt_content: str = Field(..., description="The updated prompt content")
    description: Optional[str] = Field(None, description="Updated description")
    is_active: Optional[bool] = Field(None, description="Whether this prompt is active")
    updated_by: Optional[str] = Field(None, description="User ID who is updating this")


class PromptTemplateResponse(BaseModel):
    """Response model for prompt template."""

    id: str = Field(..., description="Prompt template ID")
    prompt_type: str = Field(..., description="Type of prompt template")
    prompt_content: str = Field(..., description="The actual prompt content")
    description: Optional[str] = Field(None, description="Description of this prompt")
    is_active: bool = Field(..., description="Whether this prompt is currently active")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    updated_by: Optional[str] = Field(None, description="User ID who last updated this")
