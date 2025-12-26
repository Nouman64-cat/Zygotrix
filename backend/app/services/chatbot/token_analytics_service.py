"""
Token Analytics Service for usage tracking and cost calculations.

Extracted from chatbot.py as part of Phase 2.4 refactoring.
Handles token usage logging, aggregation, and cost calculations.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

# Default model for fallback
CLAUDE_MODEL = "claude-3-haiku-20240307"

# =============================================================================
# MODEL PRICING CONFIGURATION
# =============================================================================

# Pricing per 1K tokens (updated 2025)
MODEL_PRICING = {
    "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
    "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
    "claude-3-opus-20240229": {"input": 0.015, "output": 0.075},
    "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
    "claude-3-5-haiku-20241022": {"input": 0.0008, "output": 0.004},
    "claude-sonnet-4-5-20250514": {"input": 0.003, "output": 0.015},
    "claude-opus-4-5-20251101": {"input": 0.005, "output": 0.025},
    "claude-haiku-4-5-20250514": {"input": 0.001, "output": 0.005},
}

# OpenAI Embedding Model Pricing (per 1M tokens)
EMBEDDING_MODEL_PRICING = {
    "text-embedding-3-small": 0.00002,  # $0.02 per 1M tokens
    "text-embedding-3-large": 0.00013,  # $0.13 per 1M tokens
    "text-embedding-ada-002": 0.0001,   # $0.10 per 1M tokens
}


class TokenAnalyticsService:
    """
    Service for token usage analytics and cost tracking.
    
    Responsibilities:
    - Log token usage to MongoDB
    - Aggregate usage statistics
    - Calculate costs per model
    - Generate daily/user reports
    """
    
    def get_model_pricing(self, model: str) -> Dict[str, float]:
        """Get pricing for a specific model. Defaults to Haiku 3 if model not found."""
        return MODEL_PRICING.get(model, {"input": 0.00025, "output": 0.00125})
    
    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Calculate cost based on model-specific pricing."""
        pricing = self.get_model_pricing(model)
        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (output_tokens / 1000) * pricing["output"]
        return input_cost + output_cost

    def calculate_cost_with_cache(
        self,
        input_tokens: int,
        output_tokens: int,
        cache_creation_tokens: int,
        cache_read_tokens: int,
        model: str
    ) -> Dict[str, float]:
        """
        Calculate cost with prompt caching factored in.

        Prompt caching pricing:
        - Cache writes: 25% more than base input tokens
        - Cache reads: 90% less than base input tokens
        - Regular input/output: Standard pricing

        Returns dict with: total_cost, input_cost, output_cost, cache_cost, savings
        """
        pricing = self.get_model_pricing(model)

        # Regular input tokens (not cached)
        regular_input_cost = (input_tokens / 1000) * pricing["input"]

        # Cache writes cost 25% more
        cache_write_cost = (cache_creation_tokens / 1000) * (pricing["input"] * 1.25)

        # Cache reads cost 90% less
        cache_read_cost = (cache_read_tokens / 1000) * (pricing["input"] * 0.1)

        # Output tokens at standard rate
        output_cost = (output_tokens / 1000) * pricing["output"]

        # Calculate what it would have cost without caching
        cost_without_cache = ((input_tokens + cache_creation_tokens + cache_read_tokens) / 1000) * pricing["input"]

        # Actual cache cost
        cache_cost = cache_write_cost + cache_read_cost

        # Total cost
        total_cost = regular_input_cost + cache_cost + output_cost

        # Savings from using cache
        savings = cost_without_cache - (regular_input_cost + cache_cost)

        return {
            "total_cost": total_cost,
            "input_cost": regular_input_cost,
            "output_cost": output_cost,
            "cache_cost": cache_cost,
            "cache_write_cost": cache_write_cost,
            "cache_read_cost": cache_read_cost,
            "savings": max(0, savings),  # Ensure non-negative
            "cost_without_cache": cost_without_cache
        }
    
    def log_usage(
        self,
        user_id: Optional[str],
        user_name: Optional[str],
        input_tokens: int,
        output_tokens: int,
        cached: bool,
        message_preview: str,
        model: Optional[str] = None,
        cache_creation_input_tokens: int = 0,
        cache_read_input_tokens: int = 0
    ) -> None:
        """Log token usage to MongoDB for admin tracking with prompt caching metrics."""
        try:
            from ..common import get_token_usage_collection

            collection = get_token_usage_collection()
            if collection is None:
                return  # MongoDB not available

            doc = {
                "user_id": user_id or "anonymous",
                "user_name": user_name or "Unknown",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "cached": cached,
                "cache_creation_input_tokens": cache_creation_input_tokens,
                "cache_read_input_tokens": cache_read_input_tokens,
                "message_preview": message_preview,
                "model": model or CLAUDE_MODEL,
                "timestamp": datetime.now(timezone.utc),
            }

            collection.insert_one(doc)
            logger.debug(f"Logged token usage: {input_tokens + output_tokens} tokens (cache read: {cache_read_input_tokens}, cache creation: {cache_creation_input_tokens}) for user {user_id or 'anonymous'}")
        except Exception as e:
            logger.warning(f"Failed to log token usage: {e}")
    
    def get_aggregate_stats(self) -> Dict:
        """Get aggregate token usage statistics for all users."""
        try:
            from ..common import get_token_usage_collection
            
            collection = get_token_usage_collection()
            if collection is None:
                return {"error": "MongoDB not available", "users": []}
            
            # Aggregate token usage by user
            pipeline = [
                {
                    "$group": {
                        "_id": "$user_id",
                        "user_name": {"$last": "$user_name"},
                        "total_input_tokens": {"$sum": "$input_tokens"},
                        "total_output_tokens": {"$sum": "$output_tokens"},
                        "total_tokens": {"$sum": "$total_tokens"},
                        "cache_creation_tokens": {"$sum": {"$ifNull": ["$cache_creation_input_tokens", 0]}},
                        "cache_read_tokens": {"$sum": {"$ifNull": ["$cache_read_input_tokens", 0]}},
                        "request_count": {"$sum": 1},
                        "cached_count": {
                            "$sum": {"$cond": [{"$eq": ["$cached", True]}, 1, 0]}
                        },
                        "last_request": {"$max": "$timestamp"},
                    }
                },
                {"$sort": {"total_tokens": -1}}
            ]
            
            results = list(collection.aggregate(pipeline))
            
            # Calculate totals
            total_tokens = sum(r.get("total_tokens", 0) for r in results)
            total_requests = sum(r.get("request_count", 0) for r in results)
            cached_requests = sum(r.get("cached_count", 0) for r in results)
            total_cache_creation = sum(r.get("cache_creation_tokens", 0) for r in results)
            total_cache_read = sum(r.get("cache_read_tokens", 0) for r in results)
            total_input = sum(r.get("total_input_tokens", 0) for r in results)
            total_output = sum(r.get("total_output_tokens", 0) for r in results)

            # Calculate total savings (approximate using average model pricing)
            avg_input_price = 0.003  # Average across models
            cache_savings = (total_cache_read * 0.9 * avg_input_price) / 1000  # 90% savings on cache reads

            # Format user data
            users = []
            for r in results:
                cache_read = r.get("cache_read_tokens", 0)
                cache_creation = r.get("cache_creation_tokens", 0)
                user_savings = (cache_read * 0.9 * avg_input_price) / 1000

                users.append({
                    "user_id": r["_id"],
                    "user_name": r.get("user_name", "Unknown"),
                    "total_tokens": r.get("total_tokens", 0),
                    "input_tokens": r.get("total_input_tokens", 0),
                    "output_tokens": r.get("total_output_tokens", 0),
                    "cache_creation_tokens": cache_creation,
                    "cache_read_tokens": cache_read,
                    "request_count": r.get("request_count", 0),
                    "cached_count": r.get("cached_count", 0),
                    "cache_hit_rate": f"{(r.get('cached_count', 0) / r.get('request_count', 1)) * 100:.1f}%",
                    "cache_savings": round(user_savings, 4),
                    "last_request": r.get("last_request").isoformat() if r.get("last_request") else None,
                })

            return {
                "total_tokens": total_tokens,
                "total_input_tokens": total_input,
                "total_output_tokens": total_output,
                "total_cache_creation_tokens": total_cache_creation,
                "total_cache_read_tokens": total_cache_read,
                "total_requests": total_requests,
                "cached_requests": cached_requests,
                "cache_hit_rate": f"{(cached_requests / total_requests * 100) if total_requests > 0 else 0:.1f}%",
                "prompt_cache_hit_rate": f"{(total_cache_read / (total_input + total_cache_creation + total_cache_read) * 100) if (total_input + total_cache_creation + total_cache_read) > 0 else 0:.1f}%",
                "total_cache_savings": round(cache_savings, 4),
                "user_count": len(users),
                "users": users,
            }
        except Exception as e:
            logger.error(f"Error fetching token usage stats: {e}")
            return {"error": str(e), "users": []}
    
    def get_user_stats(self, user_id: str, limit: int = 50) -> Dict:
        """Get detailed token usage history for a specific user."""
        try:
            from ..common import get_token_usage_collection
            
            collection = get_token_usage_collection()
            if collection is None:
                return {"error": "MongoDB not available", "history": []}
            
            # Get recent history for user
            history = list(
                collection.find({"user_id": user_id})
                .sort("timestamp", -1)
                .limit(limit)
            )
            
            # Calculate totals for this user
            total_tokens = sum(h.get("total_tokens", 0) for h in history)
            
            # Format history
            formatted_history = []
            for h in history:
                formatted_history.append({
                    "timestamp": h.get("timestamp").isoformat() if h.get("timestamp") else None,
                    "input_tokens": h.get("input_tokens", 0),
                    "output_tokens": h.get("output_tokens", 0),
                    "total_tokens": h.get("total_tokens", 0),
                    "cached": h.get("cached", False),
                    "message_preview": h.get("message_preview", ""),
                    "model": h.get("model", "unknown"),
                })
            
            return {
                "user_id": user_id,
                "total_tokens": total_tokens,
                "request_count": len(history),
                "history": formatted_history,
            }
        except Exception as e:
            logger.error(f"Error fetching user token usage: {e}")
            return {"error": str(e), "history": []}
    
    def log_embedding_usage(
        self,
        user_id: Optional[str],
        user_name: Optional[str],
        tokens: int,
        model: str,
        query_preview: str
    ) -> None:
        """Log embedding token usage to MongoDB for admin tracking."""
        try:
            from ..common import get_embedding_usage_collection

            collection = get_embedding_usage_collection()
            if collection is None:
                return  # MongoDB not available

            # Calculate cost for embeddings
            cost = self.calculate_embedding_cost(tokens, model)

            doc = {
                "user_id": user_id or "anonymous",
                "user_name": user_name or "Unknown",
                "tokens": tokens,
                "model": model,
                "cost": cost,
                "query_preview": query_preview,
                "timestamp": datetime.now(timezone.utc),
            }

            collection.insert_one(doc)
            logger.debug(f"Logged embedding usage: {tokens} tokens (${cost:.6f}) for user {user_id or 'anonymous'}")
        except Exception as e:
            logger.warning(f"Failed to log embedding usage: {e}")

    def calculate_embedding_cost(self, tokens: int, model: str) -> float:
        """Calculate cost for embedding model usage."""
        pricing = EMBEDDING_MODEL_PRICING.get(model, 0.00002)  # Default to text-embedding-3-small
        return (tokens / 1_000_000) * pricing

    def get_embedding_stats(self) -> Dict:
        """Get aggregate embedding usage statistics."""
        try:
            from ..common import get_embedding_usage_collection

            collection = get_embedding_usage_collection()
            if collection is None:
                return {"error": "MongoDB not available", "users": []}

            # Aggregate embedding usage by user
            pipeline = [
                {
                    "$group": {
                        "_id": "$user_id",
                        "user_name": {"$last": "$user_name"},
                        "total_tokens": {"$sum": "$tokens"},
                        "total_cost": {"$sum": "$cost"},
                        "request_count": {"$sum": 1},
                        "last_request": {"$max": "$timestamp"},
                    }
                },
                {"$sort": {"total_tokens": -1}}
            ]

            results = list(collection.aggregate(pipeline))

            # Calculate totals
            total_tokens = sum(r.get("total_tokens", 0) for r in results)
            total_cost = sum(r.get("total_cost", 0) for r in results)
            total_requests = sum(r.get("request_count", 0) for r in results)

            # Format user data
            users = []
            for r in results:
                users.append({
                    "user_id": r["_id"],
                    "user_name": r.get("user_name", "Unknown"),
                    "total_tokens": r.get("total_tokens", 0),
                    "total_cost": round(r.get("total_cost", 0), 6),
                    "request_count": r.get("request_count", 0),
                    "avg_tokens_per_request": round(r.get("total_tokens", 0) / r.get("request_count", 1), 0),
                    "last_request": r.get("last_request").isoformat() if r.get("last_request") else None,
                })

            return {
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 6),
                "total_requests": total_requests,
                "avg_tokens_per_request": round(total_tokens / total_requests, 0) if total_requests > 0 else 0,
                "user_count": len(users),
                "users": users,
            }
        except Exception as e:
            logger.error(f"Error fetching embedding usage stats: {e}")
            return {"error": str(e), "users": []}

    def get_embedding_daily_stats(self, days: int = 30) -> Dict:
        """Get daily aggregated embedding usage for the last N days."""
        try:
            from ..common import get_embedding_usage_collection

            collection = get_embedding_usage_collection()
            if collection is None:
                return {"error": "MongoDB not available", "daily_usage": []}

            # Calculate date range
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)

            # Aggregate by day and model
            pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "year": {"$year": "$timestamp"},
                            "month": {"$month": "$timestamp"},
                            "day": {"$dayOfMonth": "$timestamp"},
                            "model": "$model"
                        },
                        "total_tokens": {"$sum": "$tokens"},
                        "total_cost": {"$sum": "$cost"},
                        "request_count": {"$sum": 1},
                        "unique_users": {"$addToSet": "$user_id"}
                    }
                },
                {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
            ]

            results = list(collection.aggregate(pipeline))

            # Group by date
            daily_data = {}
            for r in results:
                date_str = f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}"
                model = r['_id'].get('model', 'text-embedding-3-small')

                if date_str not in daily_data:
                    daily_data[date_str] = {
                        "total_tokens": 0,
                        "total_cost": 0.0,
                        "request_count": 0,
                        "unique_users": set(),
                        "models": {}
                    }

                daily_data[date_str]["total_tokens"] += r.get("total_tokens", 0)
                daily_data[date_str]["total_cost"] += r.get("total_cost", 0)
                daily_data[date_str]["request_count"] += r.get("request_count", 0)
                daily_data[date_str]["unique_users"].update(r.get("unique_users", []))

                # Track per-model usage
                if model not in daily_data[date_str]["models"]:
                    daily_data[date_str]["models"][model] = {
                        "tokens": 0,
                        "cost": 0.0,
                        "requests": 0
                    }
                daily_data[date_str]["models"][model]["tokens"] += r.get("total_tokens", 0)
                daily_data[date_str]["models"][model]["cost"] += r.get("total_cost", 0)
                daily_data[date_str]["models"][model]["requests"] += r.get("request_count", 0)

            # Format results
            daily_usage = []
            for date_str in sorted(daily_data.keys()):
                data = daily_data[date_str]
                daily_usage.append({
                    "date": date_str,
                    "total_tokens": data["total_tokens"],
                    "total_cost": round(data["total_cost"], 6),
                    "request_count": data["request_count"],
                    "unique_users": len(data["unique_users"]),
                    "avg_tokens_per_request": round(data["total_tokens"] / data["request_count"], 0) if data["request_count"] > 0 else 0,
                    "models": {
                        model: {
                            "tokens": stats["tokens"],
                            "cost": round(stats["cost"], 6),
                            "requests": stats["requests"]
                        }
                        for model, stats in data["models"].items()
                    }
                })

            # Calculate totals and projections
            total_tokens = sum(d["total_tokens"] for d in daily_usage)
            total_cost = sum(d["total_cost"] for d in daily_usage)
            total_requests = sum(d["request_count"] for d in daily_usage)
            avg_daily_tokens = total_tokens / len(daily_usage) if daily_usage else 0
            avg_daily_cost = total_cost / len(daily_usage) if daily_usage else 0

            return {
                "daily_usage": daily_usage,
                "summary": {
                    "total_tokens": total_tokens,
                    "total_cost": round(total_cost, 6),
                    "total_requests": total_requests,
                    "avg_daily_tokens": round(avg_daily_tokens, 0),
                    "avg_daily_cost": round(avg_daily_cost, 6),
                    "projected_monthly_tokens": round(avg_daily_tokens * 30, 0),
                    "projected_monthly_cost": round(avg_daily_cost * 30, 6),
                    "days_with_data": len(daily_usage)
                }
            }
        except Exception as e:
            logger.error(f"Error fetching daily embedding usage: {e}")
            return {"error": str(e), "daily_usage": []}

    def get_daily_stats(self, days: int = 30) -> Dict:
        """Get daily aggregated token usage for the last N days."""
        try:
            from ..common import get_token_usage_collection
            
            collection = get_token_usage_collection()
            if collection is None:
                return {"error": "MongoDB not available", "daily_usage": []}
            
            # Calculate date range
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            # Aggregate by day with model-specific calculations
            pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "year": {"$year": "$timestamp"},
                            "month": {"$month": "$timestamp"},
                            "day": {"$dayOfMonth": "$timestamp"},
                            "model": "$model"
                        },
                        "total_tokens": {"$sum": "$total_tokens"},
                        "input_tokens": {"$sum": "$input_tokens"},
                        "output_tokens": {"$sum": "$output_tokens"},
                        "cache_creation_tokens": {"$sum": {"$ifNull": ["$cache_creation_input_tokens", 0]}},
                        "cache_read_tokens": {"$sum": {"$ifNull": ["$cache_read_input_tokens", 0]}},
                        "request_count": {"$sum": 1},
                        "cached_count": {
                            "$sum": {"$cond": [{"$eq": ["$cached", True]}, 1, 0]}
                        },
                        "unique_users": {"$addToSet": "$user_id"}
                    }
                },
                {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
            ]

            results = list(collection.aggregate(pipeline))

            # Group by date and calculate total costs across all models
            daily_data = {}
            for r in results:
                date_str = f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}"
                model = r['_id'].get('model', 'claude-3-haiku-20240307')

                if date_str not in daily_data:
                    daily_data[date_str] = {
                        "total_tokens": 0,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "cache_creation_tokens": 0,
                        "cache_read_tokens": 0,
                        "request_count": 0,
                        "cached_count": 0,
                        "unique_users": set(),
                        "cost": 0.0,
                        "prompt_cache_savings": 0.0,
                        "response_cache_savings": 0.0
                    }

                input_tokens = r.get("input_tokens", 0)
                output_tokens = r.get("output_tokens", 0)
                cache_creation = r.get("cache_creation_tokens", 0)
                cache_read = r.get("cache_read_tokens", 0)
                cached_count = r.get("cached_count", 0)

                # Calculate cost using model-specific pricing with cache
                cost_data = self.calculate_cost_with_cache(
                    input_tokens, output_tokens, cache_creation, cache_read,
                    model or 'claude-3-haiku-20240307'
                )

                # Calculate response cache savings
                # Estimate: each cached response saved ~200 tokens avg (100 input + 100 output)
                pricing = self.get_model_pricing(model or 'claude-3-haiku-20240307')
                avg_tokens_per_request = 200  # Conservative estimate
                response_cache_savings = (cached_count * avg_tokens_per_request / 1000) * pricing["input"]

                daily_data[date_str]["total_tokens"] += r.get("total_tokens", 0)
                daily_data[date_str]["input_tokens"] += input_tokens
                daily_data[date_str]["output_tokens"] += output_tokens
                daily_data[date_str]["cache_creation_tokens"] += cache_creation
                daily_data[date_str]["cache_read_tokens"] += cache_read
                daily_data[date_str]["request_count"] += r.get("request_count", 0)
                daily_data[date_str]["cached_count"] += cached_count
                daily_data[date_str]["unique_users"].update(r.get("unique_users", []))
                daily_data[date_str]["cost"] += cost_data["total_cost"]
                daily_data[date_str]["prompt_cache_savings"] += cost_data["savings"]
                daily_data[date_str]["response_cache_savings"] += response_cache_savings

            # Format results
            daily_usage = []
            for date_str in sorted(daily_data.keys()):
                data = daily_data[date_str]
                daily_usage.append({
                    "date": date_str,
                    "total_tokens": data["total_tokens"],
                    "input_tokens": data["input_tokens"],
                    "output_tokens": data["output_tokens"],
                    "cache_creation_tokens": data["cache_creation_tokens"],
                    "cache_read_tokens": data["cache_read_tokens"],
                    "request_count": data["request_count"],
                    "cached_count": data["cached_count"],
                    "unique_users": len(data["unique_users"]),
                    "cost": round(data["cost"], 4),
                    "prompt_cache_savings": round(data["prompt_cache_savings"], 4),
                    "response_cache_savings": round(data["response_cache_savings"], 4),
                    "cache_savings": round(data["prompt_cache_savings"] + data["response_cache_savings"], 4)
                })
            
            # Calculate totals and projections
            total_tokens = sum(d["total_tokens"] for d in daily_usage)
            total_cost = sum(d["cost"] for d in daily_usage)
            total_prompt_cache_savings = sum(d["prompt_cache_savings"] for d in daily_usage)
            total_response_cache_savings = sum(d["response_cache_savings"] for d in daily_usage)
            total_cache_savings = total_prompt_cache_savings + total_response_cache_savings
            total_cache_creation = sum(d["cache_creation_tokens"] for d in daily_usage)
            total_cache_read = sum(d["cache_read_tokens"] for d in daily_usage)
            avg_daily_tokens = total_tokens / len(daily_usage) if daily_usage else 0
            avg_daily_cost = total_cost / len(daily_usage) if daily_usage else 0
            avg_daily_savings = total_cache_savings / len(daily_usage) if daily_usage else 0

            return {
                "daily_usage": daily_usage,
                "summary": {
                    "total_tokens": total_tokens,
                    "total_cost": round(total_cost, 4),
                    "total_cache_creation_tokens": total_cache_creation,
                    "total_cache_read_tokens": total_cache_read,
                    "total_cache_savings": round(total_cache_savings, 4),
                    "total_prompt_cache_savings": round(total_prompt_cache_savings, 4),
                    "total_response_cache_savings": round(total_response_cache_savings, 4),
                    "avg_daily_tokens": round(avg_daily_tokens, 0),
                    "avg_daily_cost": round(avg_daily_cost, 4),
                    "avg_daily_savings": round(avg_daily_savings, 4),
                    "projected_monthly_tokens": round(avg_daily_tokens * 30, 0),
                    "projected_monthly_cost": round(avg_daily_cost * 30, 4),
                    "projected_monthly_savings": round(avg_daily_savings * 30, 4),
                    "days_with_data": len(daily_usage)
                }
            }
        except Exception as e:
            logger.error(f"Error fetching daily token usage: {e}")
            return {"error": str(e), "daily_usage": []}


# Global singleton instance
_token_analytics_service: Optional[TokenAnalyticsService] = None


def get_token_analytics_service() -> TokenAnalyticsService:
    """Get or create the global TokenAnalyticsService instance."""
    global _token_analytics_service
    if _token_analytics_service is None:
        _token_analytics_service = TokenAnalyticsService()
    return _token_analytics_service