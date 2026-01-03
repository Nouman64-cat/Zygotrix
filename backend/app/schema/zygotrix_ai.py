"""
Zygotrix AI - Professional Chatbot Schema
==========================================
Pydantic models for conversations, messages, and AI interactions.
Designed to match professional standards like ChatGPT/Gemini interfaces.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid


# =============================================================================
# ENUMS
# =============================================================================

class MessageRole(str, Enum):
    """Role of the message sender."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageStatus(str, Enum):
    """Status of a message."""
    PENDING = "pending"
    STREAMING = "streaming"
    COMPLETED = "completed"
    ERROR = "error"
    STOPPED = "stopped"


class ConversationStatus(str, Enum):
    """Status of a conversation."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class ModelProvider(str, Enum):
    """Available AI model providers."""
    CLAUDE = "claude"
    GEMINI = "gemini"


class FeedbackType(str, Enum):
    """Type of feedback on a message."""
    LIKE = "like"
    DISLIKE = "dislike"


# =============================================================================
# MESSAGE MODELS
# =============================================================================

class MessageAttachment(BaseModel):
    """Attachment in a message (file, image, etc.)."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = Field(description="Attachment type: image, file, code")
    name: str = Field(description="Original filename")
    url: Optional[str] = Field(default=None, description="URL if uploaded")
    content: Optional[str] = Field(default=None, description="Inline content for code blocks")
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None


class MessageFeedback(BaseModel):
    """User feedback on a message."""
    type: FeedbackType
    comment: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class MessageMetadata(BaseModel):
    """Metadata for a message including token usage and timing."""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    model: Optional[str] = None
    provider: Optional[str] = None
    latency_ms: Optional[int] = None
    finish_reason: Optional[str] = None
    cached: bool = False

    # Widget data for interactive visualizations
    widget_type: Optional[str] = None  # 'breeding_lab', 'dna_rna_visualizer', or 'gwas_results'
    breeding_data: Optional[dict] = None  # For breeding simulations
    dna_rna_data: Optional[dict] = None  # For DNA/RNA visualizations
    gwas_data: Optional[dict] = None  # For GWAS analysis results


class Message(BaseModel):
    """A single message in a conversation."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: MessageRole
    content: str
    status: MessageStatus = MessageStatus.COMPLETED

    # Version control for editing
    version: int = 1
    parent_message_id: Optional[str] = None  # For branching conversations

    # Attachments and rich content
    attachments: List[MessageAttachment] = Field(default_factory=list)

    # Metadata
    metadata: Optional[MessageMetadata] = None
    feedback: Optional[MessageFeedback] = None

    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: Optional[str] = None

    # For regenerated messages - stores alternative versions
    sibling_ids: List[str] = Field(default_factory=list)
    selected_sibling_index: int = 0


class MessageCreate(BaseModel):
    """Request model for creating a new message."""
    content: str = Field(min_length=1, max_length=100000)
    attachments: List[MessageAttachment] = Field(default_factory=list)
    parent_message_id: Optional[str] = None  # For branching


class MessageUpdate(BaseModel):
    """Request model for updating/editing a message."""
    content: str = Field(min_length=1, max_length=100000)


# =============================================================================
# CONVERSATION MODELS
# =============================================================================

class ConversationSettings(BaseModel):
    """User-customizable settings for a conversation."""
    model: str = Field(default="claude-3-haiku-20240307")
    provider: ModelProvider = ModelProvider.CLAUDE
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(default=2048, ge=128, le=8192)
    system_prompt: Optional[str] = None

    # Context settings
    context_window_messages: int = Field(default=20, ge=1, le=100)
    include_system_context: bool = True  # Include Zygotrix-specific context

    # Response preferences
    stream_response: bool = True
    enable_markdown: bool = True
    enable_code_highlighting: bool = True


class Conversation(BaseModel):
    """A conversation containing multiple messages."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str = Field(default="New Conversation")

    # Status and organization
    status: ConversationStatus = ConversationStatus.ACTIVE
    is_pinned: bool = False
    is_starred: bool = False
    folder_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    # Settings
    settings: ConversationSettings = Field(default_factory=ConversationSettings)

    # Context information
    page_context: Optional[str] = None  # Which page the conversation started from

    # Message counts
    message_count: int = 0

    # Sharing
    is_shared: bool = False
    share_id: Optional[str] = None
    shared_at: Optional[str] = None

    # Token tracking
    total_tokens_used: int = 0

    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    last_message_at: Optional[str] = None
    last_message_preview: Optional[str] = None


class ConversationCreate(BaseModel):
    """Request model for creating a new conversation."""
    title: Optional[str] = None
    settings: Optional[ConversationSettings] = None
    page_context: Optional[str] = None
    folder_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ConversationUpdate(BaseModel):
    """Request model for updating a conversation."""
    title: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_starred: Optional[bool] = None
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    settings: Optional[ConversationSettings] = None


class ConversationSummary(BaseModel):
    """Summary of a conversation for listing."""
    id: str
    user_id: str
    title: str
    status: ConversationStatus
    is_pinned: bool
    is_starred: bool
    folder_id: Optional[str]
    tags: List[str]
    message_count: int
    last_message_preview: Optional[str] = None
    last_message_at: Optional[str]
    created_at: str
    updated_at: str


# =============================================================================
# FOLDER MODELS
# =============================================================================

class Folder(BaseModel):
    """Folder for organizing conversations."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    color: Optional[str] = None  # Hex color code
    icon: Optional[str] = None  # Icon identifier
    parent_folder_id: Optional[str] = None
    sort_order: int = 0
    conversation_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class FolderCreate(BaseModel):
    """Request model for creating a folder."""
    name: str = Field(min_length=1, max_length=100)
    color: Optional[str] = None
    icon: Optional[str] = None
    parent_folder_id: Optional[str] = None


class FolderUpdate(BaseModel):
    """Request model for updating a folder."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    color: Optional[str] = None
    icon: Optional[str] = None
    parent_folder_id: Optional[str] = None
    sort_order: Optional[int] = None


# =============================================================================
# CHAT REQUEST/RESPONSE MODELS
# =============================================================================

class ChatRequest(BaseModel):
    """Request model for sending a chat message."""
    conversation_id: Optional[str] = None  # If None, creates new conversation
    message: str = Field(min_length=1, max_length=100000)
    attachments: List[MessageAttachment] = Field(default_factory=list)

    # Optional overrides for this message
    model: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=None, ge=128, le=8192)

    # For editing/regenerating
    parent_message_id: Optional[str] = None
    regenerate_message_id: Optional[str] = None

    # Context
    page_context: Optional[str] = None

    # Streaming preference (default False to enable MCP tools)
    # Note: MCP tools are only available in non-streaming mode
    stream: bool = False

    # Tools that are explicitly enabled for this message
    # E.g., ["gwas_analysis"] to enable GWAS analysis
    enabled_tools: List[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    """Response model for a chat message (non-streaming)."""
    conversation_id: str
    message: Message
    conversation_title: str
    usage: Optional[MessageMetadata] = None


class StreamChunk(BaseModel):
    """A single chunk in a streaming response."""
    type: str = Field(description="Type: content, metadata, error, done")
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# =============================================================================
# SHARING MODELS
# =============================================================================

class SharedConversation(BaseModel):
    """A shared conversation accessible via public link."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    user_id: str
    share_type: str = "read_only"  # read_only, fork_allowed
    expires_at: Optional[str] = None
    view_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ShareConversationRequest(BaseModel):
    """Request to share a conversation."""
    share_type: str = "read_only"
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=365)


class ShareConversationResponse(BaseModel):
    """Response with share link."""
    share_id: str
    share_url: str
    expires_at: Optional[str]


# =============================================================================
# EXPORT MODELS
# =============================================================================

class ExportFormat(str, Enum):
    """Supported export formats."""
    JSON = "json"
    MARKDOWN = "markdown"
    PDF = "pdf"
    TXT = "txt"


class ExportRequest(BaseModel):
    """Request to export a conversation."""
    format: ExportFormat = ExportFormat.MARKDOWN
    include_metadata: bool = False
    include_timestamps: bool = True


class ExportResponse(BaseModel):
    """Response with exported content."""
    format: ExportFormat
    filename: str
    content: str
    mime_type: str


# =============================================================================
# SEARCH MODELS
# =============================================================================

class SearchRequest(BaseModel):
    """Request to search conversations."""
    query: str = Field(min_length=1, max_length=500)
    search_in: List[str] = Field(
        default=["title", "content"],
        description="Where to search: title, content, tags"
    )
    folder_id: Optional[str] = None
    status: Optional[ConversationStatus] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class SearchResult(BaseModel):
    """A single search result."""
    conversation: ConversationSummary
    matched_messages: List[Dict[str, Any]] = Field(default_factory=list)
    relevance_score: float = 0.0


class SearchResponse(BaseModel):
    """Response from search."""
    results: List[SearchResult]
    total: int
    query: str


# =============================================================================
# ANALYTICS MODELS
# =============================================================================

class UserChatAnalytics(BaseModel):
    """Analytics for a user's chat usage."""
    user_id: str
    total_conversations: int
    total_messages: int
    total_tokens_used: int
    tokens_remaining: int
    reset_time: Optional[str]
    is_rate_limited: bool
    favorite_topics: List[str] = Field(default_factory=list)
    active_days: int
    average_messages_per_conversation: float
    model_usage: Dict[str, int] = Field(default_factory=dict)


# =============================================================================
# LIST RESPONSE MODELS
# =============================================================================

class ConversationListResponse(BaseModel):
    """Response containing list of conversations."""
    conversations: List[ConversationSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class FolderListResponse(BaseModel):
    """Response containing list of folders."""
    folders: List[Folder]
    total: int


class MessageListResponse(BaseModel):
    """Response containing list of messages."""
    messages: List[Message]
    total: int
    has_more: bool
    conversation_id: str


# =============================================================================
# PROMPT TEMPLATE MODELS
# =============================================================================

class PromptTemplate(BaseModel):
    """A saved prompt template."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: bool = False
    use_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class PromptTemplateCreate(BaseModel):
    """Request to create a prompt template."""
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=10000)
    description: Optional[str] = Field(default=None, max_length=500)
    category: Optional[str] = None
    is_public: bool = False


class PromptTemplateUpdate(BaseModel):
    """Request to update a prompt template."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    description: Optional[str] = Field(default=None, max_length=500)
    category: Optional[str] = None
    is_public: Optional[bool] = None


# =============================================================================
# USER PREFERENCE MODELS
# =============================================================================

class ChatPreferences(BaseModel):
    """
    User preferences for how Zygotrix AI responds.

    These preferences are automatically learned from user prompts and can be
    manually adjusted in the chatbot settings.
    """
    # Communication style
    communication_style: str = Field(
        default="conversational",
        description="How AI communicates: simple, technical, or conversational"
    )

    # Answer length preference
    answer_length: str = Field(
        default="balanced",
        description="Response length preference: brief, balanced, or detailed"
    )

    # Teaching aids (what helps the user learn)
    teaching_aids: List[str] = Field(
        default_factory=list,
        description="Preferred teaching methods: examples, real_world, analogies, step_by_step"
    )

    # Visual aids (how information is presented)
    visual_aids: List[str] = Field(
        default_factory=list,
        description="Preferred visual formats: diagrams, lists, tables"
    )

    # Internal fields for automatic learning
    preference_scores: Dict[str, int] = Field(
        default_factory=dict,
        description="Internal scores (0-100) for each preference signal"
    )

    # Auto-learning toggle
    auto_learn: bool = Field(
        default=True,
        description="Enable automatic preference learning from user prompts"
    )

    # Tracking metadata
    last_updated: Optional[str] = Field(
        default=None,
        description="When preferences were last updated"
    )

    updated_by: Optional[str] = Field(
        default=None,
        description="Who/what updated preferences: 'system' or 'manual'"
    )
