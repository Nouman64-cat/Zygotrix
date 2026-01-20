"""
Web Search Analytics Service.

Provides analytics and statistics for web search usage.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

from ..common import get_database

logger = logging.getLogger(__name__)


class WebSearchAnalyticsService:
    """Service for web search analytics and usage statistics."""
    
    def __init__(self, db=None):
        """Initialize the analytics service."""
        if db is None:
            self._db = get_database()
        else:
            self._db = db
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """
        Get aggregate web search statistics for all users.
        
        Returns:
            Dictionary with total searches, costs, and per-user breakdown.
        """
        try:
            # Aggregate stats from web_search_usage collection
            pipeline = [
                {
                    "$group": {
                        "_id": "$user_id",
                        "user_name": {"$first": "$user_name"},
                        "total_searches": {"$sum": "$search_count"},
                        "total_input_tokens": {"$sum": "$input_tokens"},
                        "total_output_tokens": {"$sum": "$output_tokens"},
                        "search_cost": {"$sum": "$search_cost"},
                        "token_cost": {"$sum": "$token_cost"},
                        "total_cost": {"$sum": "$total_cost"},
                        "request_count": {"$sum": 1},
                        "last_search": {"$max": "$timestamp"}
                    }
                },
                {
                    "$sort": {"total_cost": -1}  # Sort by cost, highest first
                }
            ]
            
            user_stats = list(self._db.web_search_usage.aggregate(pipeline))
            
            # Calculate totals
            total_searches = sum(u.get("total_searches", 0) for u in user_stats)
            total_input_tokens = sum(u.get("total_input_tokens", 0) for u in user_stats)
            total_output_tokens = sum(u.get("total_output_tokens", 0) for u in user_stats)
            total_search_cost = sum(u.get("search_cost", 0) for u in user_stats)
            total_token_cost = sum(u.get("token_cost", 0) for u in user_stats)
            total_cost = sum(u.get("total_cost", 0) for u in user_stats)
            total_requests = sum(u.get("request_count", 0) for u in user_stats)
            
            # Format users
            users = []
            for u in user_stats:
                last_search = u.get("last_search")
                if isinstance(last_search, datetime):
                    last_search = last_search.isoformat()
                
                users.append({
                    "user_id": u.get("_id", "unknown"),
                    "user_name": u.get("user_name", "Unknown"),
                    "total_searches": u.get("total_searches", 0),
                    "input_tokens": u.get("total_input_tokens", 0),
                    "output_tokens": u.get("total_output_tokens", 0),
                    "search_cost": u.get("search_cost", 0),
                    "token_cost": u.get("token_cost", 0),
                    "total_cost": u.get("total_cost", 0),
                    "request_count": u.get("request_count", 0),
                    "last_search": last_search
                })
            
            return {
                "total_searches": total_searches,
                "total_input_tokens": total_input_tokens,
                "total_output_tokens": total_output_tokens,
                "total_search_cost": total_search_cost,
                "total_token_cost": total_token_cost,
                "total_cost": total_cost,
                "total_requests": total_requests,
                "user_count": len(users),
                "avg_searches_per_request": round(total_searches / total_requests, 2) if total_requests > 0 else 0,
                "avg_cost_per_search": round(total_cost / total_searches, 4) if total_searches > 0 else 0,
                "cost_breakdown": {
                    "search_api_cost": total_search_cost,  # $10/1k searches
                    "claude_token_cost": total_token_cost,
                    "total": total_cost
                },
                "users": users
            }
            
        except Exception as e:
            logger.error(f"Failed to get web search aggregate stats: {e}")
            return {
                "total_searches": 0,
                "total_cost": 0,
                "error": str(e)
            }
    
    def get_daily_stats(self, days: int = 30) -> Dict[str, Any]:
        """
        Get daily web search statistics for the specified number of days.
        
        Args:
            days: Number of days to include (default 30)
            
        Returns:
            Dictionary with daily breakdown and summary.
        """
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Get daily aggregates
            pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": start_date}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$timestamp"
                            }
                        },
                        "searches": {"$sum": "$search_count"},
                        "input_tokens": {"$sum": "$input_tokens"},
                        "output_tokens": {"$sum": "$output_tokens"},
                        "search_cost": {"$sum": "$search_cost"},
                        "token_cost": {"$sum": "$token_cost"},
                        "total_cost": {"$sum": "$total_cost"},
                        "requests": {"$sum": 1},
                        "unique_users": {"$addToSet": "$user_id"}
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "searches": 1,
                        "input_tokens": 1,
                        "output_tokens": 1,
                        "search_cost": 1,
                        "token_cost": 1,
                        "total_cost": 1,
                        "requests": 1,
                        "unique_users": {"$size": "$unique_users"}
                    }
                },
                {
                    "$sort": {"_id": 1}
                }
            ]
            
            daily_data = list(self._db.web_search_usage.aggregate(pipeline))
            
            # Build complete date range (including days with no data)
            daily_usage = []
            current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Create a lookup from the aggregated data
            data_by_date = {d["_id"]: d for d in daily_data}
            
            while current_date <= end_date:
                date_str = current_date.strftime("%Y-%m-%d")
                if date_str in data_by_date:
                    d = data_by_date[date_str]
                    daily_usage.append({
                        "date": date_str,
                        "searches": d.get("searches", 0),
                        "input_tokens": d.get("input_tokens", 0),
                        "output_tokens": d.get("output_tokens", 0),
                        "search_cost": d.get("search_cost", 0),
                        "token_cost": d.get("token_cost", 0),
                        "total_cost": d.get("total_cost", 0),
                        "requests": d.get("requests", 0),
                        "unique_users": d.get("unique_users", 0)
                    })
                else:
                    daily_usage.append({
                        "date": date_str,
                        "searches": 0,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "search_cost": 0,
                        "token_cost": 0,
                        "total_cost": 0,
                        "requests": 0,
                        "unique_users": 0
                    })
                current_date += timedelta(days=1)
            
            # Calculate summary
            total_searches = sum(d["searches"] for d in daily_usage)
            total_cost = sum(d["total_cost"] for d in daily_usage)
            days_with_data = sum(1 for d in daily_usage if d["searches"] > 0)
            
            avg_daily_cost = total_cost / days_with_data if days_with_data > 0 else 0
            projected_monthly_cost = avg_daily_cost * 30
            
            return {
                "period_days": days,
                "total_searches": total_searches,
                "total_cost": total_cost,
                "avg_daily_cost": avg_daily_cost,
                "projected_monthly_cost": projected_monthly_cost,
                "days_with_data": days_with_data,
                "daily_usage": daily_usage
            }
            
        except Exception as e:
            logger.error(f"Failed to get daily web search stats: {e}")
            return {
                "period_days": days,
                "total_searches": 0,
                "total_cost": 0,
                "daily_usage": [],
                "error": str(e)
            }


# Global singleton instance
_web_search_analytics_service: Optional[WebSearchAnalyticsService] = None


def get_web_search_analytics_service() -> WebSearchAnalyticsService:
    """Get or create the global WebSearchAnalyticsService instance."""
    global _web_search_analytics_service
    if _web_search_analytics_service is None:
        _web_search_analytics_service = WebSearchAnalyticsService()
    return _web_search_analytics_service
