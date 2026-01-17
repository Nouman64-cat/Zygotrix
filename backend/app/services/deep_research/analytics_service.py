"""
Deep Research Analytics Service.

Tracks and aggregates deep research usage statistics across all users.
Includes token usage from OpenAI (clarification), Claude (synthesis), and Cohere (reranking).
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from ..common import get_database

logger = logging.getLogger(__name__)

# Pricing constants
# OpenAI GPT-4o-mini pricing (per 1M tokens)
OPENAI_PRICING = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60}
}

# Claude pricing (per 1M tokens)
CLAUDE_PRICING = {
    "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
    "claude-3-5-sonnet-20241022": {"input": 3.0, "output": 15.0},
    "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
}

# Cohere reranking pricing
# $2 per 1000 search units (a search unit = 1 query with up to 100 documents)
COHERE_PRICE_PER_1K_SEARCHES = 2.0


class DeepResearchAnalyticsService:
    """
    Service for tracking deep research usage analytics.
    
    Tracks:
    - Number of deep research queries per user
    - Token usage across all models (OpenAI, Claude)
    - Cohere reranking costs
    - Processing times and success rates
    """
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.deep_research_usage
        
    def log_usage(
        self,
        user_id: str,
        user_name: Optional[str],
        session_id: str,
        query: str,
        status: str,
        token_usage: Dict[str, Dict[str, int]],
        sources_used: int,
        processing_time_ms: int,
        phase: str = "completed",
        claude_model: str = "claude-sonnet-4-20250514"
    ):
        """Log deep research usage to MongoDB."""
        try:
            # Calculate costs
            openai_tokens = token_usage.get("openai", {})
            claude_tokens = token_usage.get("claude", {})
            
            openai_cost = self._calculate_openai_cost(
                openai_tokens.get("input_tokens", 0),
                openai_tokens.get("output_tokens", 0)
            )
            
            claude_cost = self._calculate_claude_cost(
                claude_tokens.get("input_tokens", 0),
                claude_tokens.get("output_tokens", 0),
                model=claude_model
            )
            
            # Cohere cost: 1 search unit per query (with up to 100 docs)
            cohere_cost = COHERE_PRICE_PER_1K_SEARCHES / 1000 if sources_used > 0 else 0
            
            total_cost = openai_cost + claude_cost + cohere_cost
            
            doc = {
                "user_id": user_id,
                "user_name": user_name,
                "session_id": session_id,
                "query": query[:500],  # Truncate for storage
                "status": status,
                "phase": phase,
                "openai_input_tokens": openai_tokens.get("input_tokens", 0),
                "openai_output_tokens": openai_tokens.get("output_tokens", 0),
                "claude_input_tokens": claude_tokens.get("input_tokens", 0),
                "claude_output_tokens": claude_tokens.get("output_tokens", 0),
                "claude_model": claude_model,
                "sources_retrieved": sources_used,
                "cohere_searches": 1 if sources_used > 0 else 0,
                "processing_time_ms": processing_time_ms,
                "openai_cost": openai_cost,
                "claude_cost": claude_cost,
                "cohere_cost": cohere_cost,
                "total_cost": total_cost,
                "timestamp": datetime.utcnow()
            }
            
            self.collection.insert_one(doc)
            logger.info(f"📊 Logged deep research usage for user {user_id}: ${total_cost:.4f} ({claude_model})")
            
        except Exception as e:
            logger.error(f"Failed to log deep research usage: {e}")
    
    def _calculate_openai_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate OpenAI GPT-4o-mini cost."""
        pricing = OPENAI_PRICING.get("gpt-4o-mini", {"input": 0.15, "output": 0.60})
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        return input_cost + output_cost
    
    def _calculate_claude_cost(self, input_tokens: int, output_tokens: int, model: str = "claude-sonnet-4-20250514") -> float:
        """Calculate Claude cost."""
        pricing = CLAUDE_PRICING.get(model, CLAUDE_PRICING.get("claude-sonnet-4-20250514"))
        if not pricing:
             # Fallback to general Sonnet pricing if model not found
             pricing = {"input": 3.0, "output": 15.0}
             
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        return input_cost + output_cost
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Get aggregate deep research usage statistics."""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_queries": {"$sum": 1},
                        "completed_queries": {
                            "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                        },
                        "failed_queries": {
                            "$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}
                        },
                        "total_openai_input_tokens": {"$sum": "$openai_input_tokens"},
                        "total_openai_output_tokens": {"$sum": "$openai_output_tokens"},
                        "total_claude_input_tokens": {"$sum": "$claude_input_tokens"},
                        "total_claude_output_tokens": {"$sum": "$claude_output_tokens"},
                        "total_cohere_searches": {"$sum": "$cohere_searches"},
                        "total_sources_retrieved": {"$sum": "$sources_retrieved"},
                        "total_openai_cost": {"$sum": "$openai_cost"},
                        "total_claude_cost": {"$sum": "$claude_cost"},
                        "total_cohere_cost": {"$sum": "$cohere_cost"},
                        "total_cost": {"$sum": "$total_cost"},
                        "avg_processing_time_ms": {"$avg": "$processing_time_ms"},
                        "unique_users": {"$addToSet": "$user_id"}
                    }
                }
            ]
            
            result = list(self.collection.aggregate(pipeline))
            
            if not result:
                return {
                    "total_queries": 0,
                    "completed_queries": 0,
                    "failed_queries": 0,
                    "success_rate": "0%",
                    "total_openai_input_tokens": 0,
                    "total_openai_output_tokens": 0,
                    "total_claude_input_tokens": 0,
                    "total_claude_output_tokens": 0,
                    "total_cohere_searches": 0,
                    "total_sources_retrieved": 0,
                    "total_openai_cost": 0,
                    "total_claude_cost": 0,
                    "total_cohere_cost": 0,
                    "total_cost": 0,
                    "avg_processing_time_ms": 0,
                    "user_count": 0,
                    "users": []
                }
            
            stats = result[0]
            total = stats.get("total_queries", 0)
            completed = stats.get("completed_queries", 0)
            success_rate = f"{(completed / total * 100):.1f}%" if total > 0 else "0%"
            
            # Get per-user breakdown
            user_pipeline = [
                {
                    "$group": {
                        "_id": "$user_id",
                        "user_name": {"$first": "$user_name"},
                        "total_queries": {"$sum": 1},
                        "openai_tokens": {"$sum": {"$add": ["$openai_input_tokens", "$openai_output_tokens"]}},
                        "claude_tokens": {"$sum": {"$add": ["$claude_input_tokens", "$claude_output_tokens"]}},
                        "cohere_searches": {"$sum": "$cohere_searches"},
                        "total_cost": {"$sum": "$total_cost"},
                        "last_query": {"$max": "$timestamp"}
                    }
                },
                {"$sort": {"total_queries": -1}},
                {"$limit": 50}
            ]
            
            users = list(self.collection.aggregate(user_pipeline))
            
            return {
                "total_queries": stats.get("total_queries", 0),
                "completed_queries": stats.get("completed_queries", 0),
                "failed_queries": stats.get("failed_queries", 0),
                "success_rate": success_rate,
                "total_openai_input_tokens": stats.get("total_openai_input_tokens", 0),
                "total_openai_output_tokens": stats.get("total_openai_output_tokens", 0),
                "total_claude_input_tokens": stats.get("total_claude_input_tokens", 0),
                "total_claude_output_tokens": stats.get("total_claude_output_tokens", 0),
                "total_cohere_searches": stats.get("total_cohere_searches", 0),
                "total_sources_retrieved": stats.get("total_sources_retrieved", 0),
                "total_openai_cost": round(stats.get("total_openai_cost", 0), 4),
                "total_claude_cost": round(stats.get("total_claude_cost", 0), 4),
                "total_cohere_cost": round(stats.get("total_cohere_cost", 0), 4),
                "total_cost": round(stats.get("total_cost", 0), 4),
                "avg_processing_time_ms": round(stats.get("avg_processing_time_ms", 0), 0),
                "user_count": len(stats.get("unique_users", [])),
                "users": [
                    {
                        "user_id": u["_id"],
                        "user_name": u.get("user_name", "Unknown"),
                        "total_queries": u.get("total_queries", 0),
                        "openai_tokens": u.get("openai_tokens", 0),
                        "claude_tokens": u.get("claude_tokens", 0),
                        "cohere_searches": u.get("cohere_searches", 0),
                        "total_cost": round(u.get("total_cost", 0), 4),
                        "last_query": u.get("last_query").isoformat() if u.get("last_query") else None
                    }
                    for u in users
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get aggregate stats: {e}")
            return {"error": str(e)}
    
    def get_daily_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get daily deep research usage for the last N days."""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            pipeline = [
                {"$match": {"timestamp": {"$gte": start_date}}},
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                        },
                        "queries": {"$sum": 1},
                        "completed": {
                            "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                        },
                        "openai_tokens": {"$sum": {"$add": ["$openai_input_tokens", "$openai_output_tokens"]}},
                        "claude_tokens": {"$sum": {"$add": ["$claude_input_tokens", "$claude_output_tokens"]}},
                        "cohere_searches": {"$sum": "$cohere_searches"},
                        "openai_cost": {"$sum": "$openai_cost"},
                        "claude_cost": {"$sum": "$claude_cost"},
                        "cohere_cost": {"$sum": "$cohere_cost"},
                        "total_cost": {"$sum": "$total_cost"},
                        "avg_time_ms": {"$avg": "$processing_time_ms"}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            
            result = list(self.collection.aggregate(pipeline))
            
            # Calculate totals for the period
            total_queries = sum(d.get("queries", 0) for d in result)
            total_cost = sum(d.get("total_cost", 0) for d in result)
            avg_daily_cost = total_cost / days if days > 0 else 0
            
            return {
                "period_days": days,
                "total_queries": total_queries,
                "total_cost": round(total_cost, 4),
                "avg_daily_cost": round(avg_daily_cost, 4),
                "projected_monthly_cost": round(avg_daily_cost * 30, 2),
                "daily_usage": [
                    {
                        "date": d["_id"],
                        "queries": d.get("queries", 0),
                        "completed": d.get("completed", 0),
                        "openai_tokens": d.get("openai_tokens", 0),
                        "claude_tokens": d.get("claude_tokens", 0),
                        "cohere_searches": d.get("cohere_searches", 0),
                        "openai_cost": round(d.get("openai_cost", 0), 4),
                        "claude_cost": round(d.get("claude_cost", 0), 4),
                        "cohere_cost": round(d.get("cohere_cost", 0), 4),
                        "total_cost": round(d.get("total_cost", 0), 4),
                        "avg_time_ms": round(d.get("avg_time_ms", 0), 0)
                    }
                    for d in result
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get daily stats: {e}")
            return {"error": str(e), "daily_usage": []}


# Global singleton instance
_deep_research_analytics_service: Optional[DeepResearchAnalyticsService] = None


def get_deep_research_analytics_service() -> DeepResearchAnalyticsService:
    """Get or create the global DeepResearchAnalyticsService instance."""
    global _deep_research_analytics_service
    if _deep_research_analytics_service is None:
        _deep_research_analytics_service = DeepResearchAnalyticsService()
    return _deep_research_analytics_service
