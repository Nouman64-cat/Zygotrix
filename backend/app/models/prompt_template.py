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


class PromptChange(BaseModel):
    """Individual prompt field change."""

    field_name: str = Field(..., description="Name of the field that changed")
    old_value: Optional[str] = Field(None, description="Previous value")
    new_value: Optional[str] = Field(None, description="New value")


class PromptTemplateHistory(BaseModel):
    """Prompt template change history entry."""

    id: Optional[str] = None
    timestamp: str = Field(..., description="When the change occurred")
    prompt_type: str = Field(..., description="Type of prompt that was changed")
    action: str = Field(..., description="Action performed: 'update' or 'reset'")
    updated_by: str = Field(..., description="User ID of admin who made the change")
    updated_by_name: Optional[str] = Field(None, description="Name of admin")
    updated_by_email: Optional[str] = Field(None, description="Email of admin")
    changes: list[PromptChange] = Field(..., description="List of changes made")
    ip_address: Optional[str] = Field(None, description="IP address of request")
    user_agent: Optional[str] = Field(None, description="User agent of request")


class PromptTemplateHistoryResponse(BaseModel):
    """Response containing prompt template history."""

    history: list[PromptTemplateHistory] = Field(..., description="List of history entries")
    total_count: int = Field(..., description="Total number of history entries")
