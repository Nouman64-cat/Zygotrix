from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatbotSettings(BaseModel):
    """Chatbot configuration settings."""

    id: Optional[str] = None
    token_limit_per_session: int = Field(
        default=25000,
        ge=1000,
        le=200000,
        description="Maximum tokens a user can consume per session"
    )
    max_tokens: int = Field(
        default=1024,
        ge=128,
        le=4096,
        description="Maximum tokens per chatbot response"
    )
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Response creativity level (0.0 = focused, 1.0 = creative)"
    )
    reset_limit_hours: int = Field(
        default=5,
        ge=1,
        le=168,
        description="Hours between token limit resets"
    )
    model: str = Field(
        default="claude-3-haiku-20240307",
        description="Claude model to use for chatbot responses"
    )
    enabled: bool = Field(
        default=True,
        description="Whether chatbot is enabled for all users"
    )
    response_caching: bool = Field(
        default=True,
        description="Whether LLM response caching is enabled"
    )
    admin_unlimited_tokens: bool = Field(
        default=False,
        description="Whether admins have unlimited token usage (bypass token limits)"
    )
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


class ChatbotSettingsUpdate(BaseModel):
    """Partial update for chatbot settings."""

    token_limit_per_session: Optional[int] = Field(
        default=None,
        ge=1000,
        le=200000
    )
    max_tokens: Optional[int] = Field(
        default=None,
        ge=128,
        le=4096
    )
    temperature: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0
    )
    reset_limit_hours: Optional[int] = Field(
        default=None,
        ge=1,
        le=168
    )
    model: Optional[str] = None
    enabled: Optional[bool] = None
    response_caching: Optional[bool] = None
    admin_unlimited_tokens: Optional[bool] = None


class ChatbotSettingsResponse(BaseModel):
    """Response after updating chatbot settings."""

    message: str
    settings: ChatbotSettings


class SettingChange(BaseModel):
    """Individual setting change."""

    field_name: str
    old_value: Optional[str | int | float | bool] = None
    new_value: Optional[str | int | float | bool] = None


class ChatbotSettingsHistory(BaseModel):
    """Chatbot settings change history entry."""

    id: Optional[str] = None
    timestamp: str
    updated_by: str  # User ID of admin who made the change
    updated_by_name: Optional[str] = None  # Name of admin
    updated_by_email: Optional[str] = None  # Email of admin
    changes: list[SettingChange]
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class ChatbotSettingsHistoryResponse(BaseModel):
    """Response containing chatbot settings history."""

    history: list[ChatbotSettingsHistory]
    total_count: int
