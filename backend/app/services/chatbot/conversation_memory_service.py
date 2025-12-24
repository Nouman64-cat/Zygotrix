"""
Conversation Memory Service for session-based chat history.

Extracted from chatbot.py as part of Phase 2.4 refactoring.
Stores conversation history per session for context-aware responses.
"""

import time
import logging
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)


class ConversationMemoryService:
    """
    Stores conversation history per session for context-aware responses.
    
    Features:
    - Session-based storage keyed by sessionId
    - TTL-based expiration (default 30 minutes)
    - Max messages per session to control token usage
    """
    
    def __init__(self, max_messages: int = 10, ttl_seconds: int = 1800):
        """
        Args:
            max_messages: Maximum number of message pairs (user+assistant) to keep per session
            ttl_seconds: Session expiration time (default 30 minutes)
        """
        self.max_messages = max_messages
        self.ttl_seconds = ttl_seconds
        self.sessions: Dict[str, Dict] = {}
    
    def get_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session."""
        if session_id not in self.sessions:
            return []
        
        session = self.sessions[session_id]
        
        # Check if expired
        if time.time() - session["last_activity"] > self.ttl_seconds:
            del self.sessions[session_id]
            return []
        
        return session["messages"]
    
    def add_message(self, session_id: str, role: str, content: str):
        """Add a message to the session history."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "messages": [],
                "last_activity": time.time()
            }
        
        session = self.sessions[session_id]
        session["messages"].append({"role": role, "content": content})
        session["last_activity"] = time.time()
        
        # Keep only the last N message pairs (2 messages per pair: user + assistant)
        max_total = self.max_messages * 2
        if len(session["messages"]) > max_total:
            session["messages"] = session["messages"][-max_total:]
        
        logger.info(f"Session {session_id[:8]}... now has {len(session['messages'])} messages")
    
    def clear_session(self, session_id: str):
        """Clear a specific session."""
        if session_id in self.sessions:
            del self.sessions[session_id]
    
    def cleanup_expired(self):
        """Remove expired sessions."""
        current_time = time.time()
        expired = [
            sid for sid, session in self.sessions.items()
            if current_time - session["last_activity"] > self.ttl_seconds
        ]
        for sid in expired:
            del self.sessions[sid]
        if expired:
            logger.info(f"Cleaned up {len(expired)} expired conversation sessions")
    
    def get_stats(self) -> Dict:
        """Get memory statistics."""
        return {
            "active_sessions": len(self.sessions),
            "max_messages_per_session": self.max_messages,
            "ttl_seconds": self.ttl_seconds
        }


# Global singleton instance
_conversation_memory: Optional[ConversationMemoryService] = None


def get_conversation_memory() -> ConversationMemoryService:
    """Get or create the global ConversationMemoryService instance."""
    global _conversation_memory
    if _conversation_memory is None:
        _conversation_memory = ConversationMemoryService(
            max_messages=1000,    # Effectively unlimited - limited by tokens instead
            ttl_seconds=18000     # 5 hours - matches rate limit window
        )
    return _conversation_memory