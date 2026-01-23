"""
Voting Service
==============
Shared voting logic for community features (questions, answers, comments).
Eliminates code duplication across different entity types.
"""

from typing import Dict, Any, Tuple
from pymongo.collection import Collection
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class VotingService:
    """
    Centralized voting service for community entities.
    
    This eliminates the duplicated vote logic that was previously
    repeated in vote_question, vote_answer, and vote_comment functions.
    """
    
    @staticmethod
    def calculate_vote_changes(
        old_vote: int,
        new_vote: int
    ) -> Tuple[int, int]:
        """
        Calculate upvote and downvote changes when a user changes their vote.
        
        Args:
            old_vote: Previous vote (-1, 0, or 1)
            new_vote: New vote (-1, 0, or 1)
            
        Returns:
            Tuple of (upvote_change, downvote_change)
            
        Examples:
            - User upvotes (0 -> 1): (1, 0)
            - User downvotes (0 -> -1): (0, 1)
            - User removes upvote (1 -> 0): (-1, 0)
            - User changes upvote to downvote (1 -> -1): (-1, 1)
        """
        upvote_change = 0
        downvote_change = 0
        
        # Remove old vote
        if old_vote == 1:
            upvote_change = -1
        elif old_vote == -1:
            downvote_change = -1
        
        # Add new vote
        if new_vote == 1:
            upvote_change += 1
        elif new_vote == -1:
            downvote_change += 1
        
        return upvote_change, downvote_change
    
    @staticmethod
    def build_vote_update_operation(
        user_id: str,
        vote_type: int,
        upvote_change: int,
        downvote_change: int
    ) -> Dict[str, Any]:
        """
        Build MongoDB update operation for voting.
        
        Args:
            user_id: User ID who is voting
            vote_type: Vote type (-1, 0, or 1)
            upvote_change: Change in upvote count
            downvote_change: Change in downvote count
            
        Returns:
            MongoDB update operation dictionary
        """
        update_op: Dict[str, Any] = {}
        
        # Update or remove vote
        if vote_type == 0:
            # Remove vote
            update_op["$unset"] = {f"votes.{user_id}": ""}
        else:
            # Add or update vote
            update_op["$set"] = {f"votes.{user_id}": vote_type}
        
        # Update vote counts
        if upvote_change != 0 or downvote_change != 0:
            update_op["$inc"] = {}
            if upvote_change != 0:
                update_op["$inc"]["upvotes"] = upvote_change
            if downvote_change != 0:
                update_op["$inc"]["downvotes"] = downvote_change
        
        return update_op
    
    @staticmethod
    def vote_entity(
        collection: Collection,
        entity_id: str,
        user_id: str,
        vote_type: int
    ) -> bool:
        """
        Apply a vote to any entity (question, answer, or comment).
        
        Args:
            collection: MongoDB collection containing the entity
            entity_id: ID of the entity to vote on
            user_id: ID of the user voting
            vote_type: Vote type (-1 for downvote, 0 to remove, 1 for upvote)
            
        Returns:
            True if vote was applied successfully, False otherwise
            
        Raises:
            ValueError: If vote_type is not -1, 0, or 1
        """
        if vote_type not in (-1, 0, 1):
            raise ValueError(f"Invalid vote_type: {vote_type}. Must be -1, 0, or 1")
        
        try:
            obj_id = ObjectId(entity_id)
        except Exception as e:
            logger.warning(f"Invalid entity_id: {entity_id} - {e}")
            return False
        
        # Get current entity
        entity = collection.find_one({"_id": obj_id})
        if not entity:
            logger.warning(f"Entity not found: {entity_id}")
            return False
        
        # Get current vote
        votes = entity.get("votes", {})
        old_vote = votes.get(user_id, 0)
        
        # Calculate changes
        upvote_change, downvote_change = VotingService.calculate_vote_changes(
            old_vote,
            vote_type
        )
        
        # Build update operation
        update_op = VotingService.build_vote_update_operation(
            user_id,
            vote_type,
            upvote_change,
            downvote_change
        )
        
        # Apply update
        result = collection.update_one({"_id": obj_id}, update_op)
        
        if result.modified_count > 0:
            logger.info(
                f"Vote applied: entity={entity_id}, user={user_id}, "
                f"vote={vote_type}, upvote_change={upvote_change}, "
                f"downvote_change={downvote_change}"
            )
            return True
        
        logger.warning(f"Vote not applied: entity={entity_id}, user={user_id}")
        return False
    
    @staticmethod
    def get_user_vote(
        collection: Collection,
        entity_id: str,
        user_id: str
    ) -> int:
        """
        Get a user's current vote on an entity.
        
        Args:
            collection: MongoDB collection containing the entity
            entity_id: ID of the entity
            user_id: ID of the user
            
        Returns:
            Current vote (-1, 0, or 1), or 0 if entity not found
        """
        try:
            obj_id = ObjectId(entity_id)
        except Exception:
            return 0
        
        entity = collection.find_one({"_id": obj_id}, {"votes": 1})
        if not entity:
            return 0
        
        votes = entity.get("votes", {})
        return votes.get(user_id, 0)
