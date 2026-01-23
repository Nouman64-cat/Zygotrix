"""
Community Serializers
=====================
Serialization logic for community features (questions, answers, comments).
"""

from typing import Dict, Any, Optional
from .base_serializer import BaseSerializer


class CommunitySerializer(BaseSerializer):
    """Serializer for community-related entities."""
    
    @staticmethod
    def question_to_dict(
        question: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Serialize a question document to API response format.
        
        Args:
            question: Question document from MongoDB
            user_id: Current user ID for vote status
            
        Returns:
            Serialized question dictionary
        """
        result = {
            "id": str(question["_id"]),
            "title": question["title"],
            "content": question["content"],
            "tags": question.get("tags", []),
            "author": {
                "id": question["author_id"],
                "email": question["author_email"],
                "full_name": question.get("author_name"),
            },
            "upvotes": question.get("upvotes", 0),
            "downvotes": question.get("downvotes", 0),
            "view_count": question.get("view_count", 0),
            "answer_count": question.get("answer_count", 0),
            "comment_count": question.get("comment_count", 0),
            "image_url": question.get("image_url"),
            "image_thumbnail_url": question.get("image_thumbnail_url"),
            "created_at": question["created_at"],
            "updated_at": question.get("updated_at"),
            "user_vote": None,
        }
        
        # Add user's vote if available
        if user_id and "votes" in question:
            user_vote = question["votes"].get(user_id)
            result["user_vote"] = user_vote
        
        return result
    
    @staticmethod
    def answer_to_dict(
        answer: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Serialize an answer document to API response format.
        
        Args:
            answer: Answer document from MongoDB
            user_id: Current user ID for vote status
            
        Returns:
            Serialized answer dictionary
        """
        result = {
            "id": str(answer["_id"]),
            "question_id": str(answer["question_id"]),
            "content": answer["content"],
            "author": {
                "id": answer["author_id"],
                "email": answer["author_email"],
                "full_name": answer.get("author_name"),
            },
            "upvotes": answer.get("upvotes", 0),
            "downvotes": answer.get("downvotes", 0),
            "is_accepted": answer.get("is_accepted", False),
            "created_at": answer["created_at"],
            "updated_at": answer.get("updated_at"),
            "user_vote": None,
        }
        
        # Add user's vote if available
        if user_id and "votes" in answer:
            user_vote = answer["votes"].get(user_id)
            result["user_vote"] = user_vote
        
        return result
    
    @staticmethod
    def comment_to_dict(
        comment: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Serialize a comment document to API response format.
        
        Args:
            comment: Comment document from MongoDB
            user_id: Current user ID for vote status
            
        Returns:
            Serialized comment dictionary
        """
        result = {
            "id": str(comment["_id"]),
            "question_id": str(comment["question_id"]),
            "content": comment["content"],
            "author": {
                "id": comment["author_id"],
                "email": comment["author_email"],
                "full_name": comment.get("author_name"),
            },
            "upvotes": comment.get("upvotes", 0),
            "downvotes": comment.get("downvotes", 0),
            "created_at": comment["created_at"],
            "updated_at": comment.get("updated_at"),
            "user_vote": None,
            "parent_id": str(comment["parent_id"]) if comment.get("parent_id") else None,
            "replies": [],
        }
        
        # Add user's vote if available
        if user_id and "votes" in comment:
            user_vote = comment["votes"].get(user_id)
            result["user_vote"] = user_vote
        
        return result
