"""
Scholar Mode Analytics Endpoints.

Provides admin analytics for Scholar Mode usage tracking.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import logging

from ..services.common import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scholar", tags=["scholar-analytics"])


@router.get("/analytics")
async def get_scholar_analytics() -> Dict[str, Any]:
    """
    Get Scholar Mode usage analytics (admin only).
    
    Returns aggregate stats across all users.
    """
    try:
        db = get_database()
        
        # Aggregate stats from scholar_usage collection
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_queries": {"$sum": 1},
                    "total_input_tokens": {"$sum": "$input_tokens"},
                    "total_output_tokens": {"$sum": "$output_tokens"},
                    "total_deep_research_sources": {"$sum": "$deep_research_sources"},
                    "total_web_search_sources": {"$sum": "$web_search_sources"},
                    "total_token_cost": {"$sum": "$token_cost"},
                    "total_source_cost": {"$sum": "$source_cost"},
                    "total_cost": {"$sum": "$total_cost"},
                }
            }
        ]
        
        result = list(db.scholar_usage.aggregate(pipeline))
        
        if not result:
            return {
                "total_queries": 0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_deep_research_sources": 0,
                "total_web_search_sources": 0,
                "total_token_cost": 0,
                "total_source_cost": 0,
                "total_cost": 0,
                "avg_tokens_per_query": 0,
                "avg_cost_per_query": 0,
                "user_count": 0,
                "users": []
            }
        
        stats = result[0]
        
        # Get per-user breakdown
        user_pipeline = [
            {
                "$group": {
                    "_id": "$user_id",
                    "user_name": {"$first": "$user_name"},
                    "total_queries": {"$sum": 1},
                    "input_tokens": {"$sum": "$input_tokens"},
                    "output_tokens": {"$sum": "$output_tokens"},
                    "deep_research_sources": {"$sum": "$deep_research_sources"},
                    "web_search_sources": {"$sum": "$web_search_sources"},
                    "total_cost": {"$sum": "$total_cost"},
                    "last_query": {"$max": "$timestamp"}
                }
            },
            {"$sort": {"total_cost": -1}},
            {"$limit": 50}
        ]
        
        users = list(db.scholar_usage.aggregate(user_pipeline))
        user_count = len(set(u["_id"] for u in users))
        
        formatted_users = []
        for user in users:
            formatted_users.append({
                "user_id": user["_id"],
                "user_name": user.get("user_name") or "Unknown",
                "total_queries": user["total_queries"],
                "input_tokens": user.get("input_tokens", 0),
                "output_tokens": user.get("output_tokens", 0),
                "deep_research_sources": user.get("deep_research_sources", 0),
                "web_search_sources": user.get("web_search_sources", 0),
                "total_cost": user.get("total_cost", 0),
                "last_query": user["last_query"].isoformat() if user.get("last_query") else None
            })
        
        total_queries = stats.get("total_queries", 0) or 1  # Avoid division by zero
        
        return {
            "total_queries": stats.get("total_queries", 0),
            "total_input_tokens": stats.get("total_input_tokens", 0),
            "total_output_tokens": stats.get("total_output_tokens", 0),
            "total_deep_research_sources": stats.get("total_deep_research_sources", 0),
            "total_web_search_sources": stats.get("total_web_search_sources", 0),
            "total_token_cost": stats.get("total_token_cost", 0),
            "total_source_cost": stats.get("total_source_cost", 0),
            "total_cost": stats.get("total_cost", 0),
            "avg_tokens_per_query": (stats.get("total_input_tokens", 0) + stats.get("total_output_tokens", 0)) / total_queries,
            "avg_cost_per_query": stats.get("total_cost", 0) / total_queries,
            "user_count": user_count,
            "users": formatted_users
        }
        
    except Exception as e:
        logger.error(f"Error fetching scholar analytics: {e}", exc_info=True)
        return {"error": str(e)}


@router.get("/analytics/daily")
async def get_scholar_daily_analytics(days: int = 30) -> Dict[str, Any]:
    """
    Get daily Scholar Mode usage for charts (admin only).
    """
    try:
        db = get_database()
        
        # Calculate start date
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                    },
                    "queries": {"$sum": 1},
                    "input_tokens": {"$sum": "$input_tokens"},
                    "output_tokens": {"$sum": "$output_tokens"},
                    "deep_research_sources": {"$sum": "$deep_research_sources"},
                    "web_search_sources": {"$sum": "$web_search_sources"},
                    "token_cost": {"$sum": "$token_cost"},
                    "source_cost": {"$sum": "$source_cost"},
                    "total_cost": {"$sum": "$total_cost"},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        results = list(db.scholar_usage.aggregate(pipeline))
        
        daily_usage = []
        total_cost = 0
        total_queries = 0
        
        for day in results:
            cost = day.get("total_cost", 0)
            queries = day.get("queries", 0)
            total_cost += cost
            total_queries += queries
            
            daily_usage.append({
                "date": day["_id"],
                "queries": queries,
                "input_tokens": day.get("input_tokens", 0),
                "output_tokens": day.get("output_tokens", 0),
                "deep_research_sources": day.get("deep_research_sources", 0),
                "web_search_sources": day.get("web_search_sources", 0),
                "token_cost": day.get("token_cost", 0),
                "source_cost": day.get("source_cost", 0),
                "total_cost": cost,
                "unique_users": len(day.get("unique_users", []))
            })
        
        days_with_data = len(daily_usage)
        avg_daily_cost = total_cost / days_with_data if days_with_data > 0 else 0
        projected_monthly = avg_daily_cost * 30
        
        return {
            "period_days": days,
            "total_queries": total_queries,
            "total_cost": total_cost,
            "avg_daily_cost": avg_daily_cost,
            "projected_monthly_cost": projected_monthly,
            "days_with_data": days_with_data,
            "daily_usage": daily_usage
        }
        
    except Exception as e:
        logger.error(f"Error fetching scholar daily analytics: {e}", exc_info=True)
        return {"error": str(e)}
