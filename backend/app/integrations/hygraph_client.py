"""Hygraph CMS integration client."""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import httpx
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


class HygraphClient:
    """Client for interacting with Hygraph CMS."""

    def __init__(self):
        self.settings = get_settings()
        self.endpoint = self.settings.hygraph_endpoint
        self.token = self.settings.hygraph_token

        # Cache with TTL
        self._course_cache: Optional[tuple[datetime, List[Dict[str, Any]]]] = None
        self._practice_cache: Optional[tuple[datetime, List[Dict[str, Any]]]] = None
        self._cache_ttl_seconds = 300  # 5 minutes

    def execute_query(self, query: str) -> Optional[Dict[str, Any]]:
        """Execute a GraphQL query against Hygraph."""
        if not self.endpoint or not self.token:
            logger.warning("Hygraph credentials not configured")
            return None

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    self.endpoint, json={"query": query}, headers=headers
                )
                response.raise_for_status()
                data = response.json()

                if "errors" in data:
                    logger.error(f"Hygraph query errors: {data['errors']}")
                    return None

                return data.get("data")

        except httpx.HTTPError as e:
            logger.error(f"Hygraph HTTP error: {e}")
            return None
        except Exception as e:
            logger.error(f"Hygraph query failed: {e}")
            return None

    def get_courses(
        self, force_refresh: bool = False
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get courses from Hygraph with caching.

        Args:
            force_refresh: If True, bypass cache and fetch fresh data
        """
        # Check cache
        if not force_refresh and self._course_cache:
            cache_time, cached_data = self._course_cache
            age = (datetime.now(timezone.utc) - cache_time).total_seconds()
            if age < self._cache_ttl_seconds:
                logger.info(f"📦 Using cached course data ({len(cached_data)} courses)")
                return cached_data

        # Fetch fresh data
        logger.info("🔄 Fetching courses from Hygraph...")

        query = """
        query UniversityCourses {
          courses {
            id
            slug
            title
            shortDescription
            longDescription {
              markdown
            }
            category
            level
            duration
            badgeLabel
            lessonsCount
            heroImage {
              url
            }
            courseOutcome {
              id
              outcome
            }
            courseModules(orderBy: order_ASC) {
              id
              title
              duration
              overview {
                markdown
              }
              slug
              order
              moduleItems {
                id
                title
                description
                content {
                  markdown
                }
                video {
                  fileName
                  url
                }
              }
              assessment {
                assessmentQuestions {
                  prompt {
                    markdown
                  }
                  explanation {
                    markdown
                  }
                  options {
                    text
                    isCorrect
                  }
                }
              }
            }
            instructors {
              id
              title
              slug
              speciality
              avatar {
                url
              }
            }
            practiceSet {
              id
              slug
              title
              tag
              description
            }
          }
        }
        """

        data = self.execute_query(query)
        if not data or "courses" not in data:
            return None

        courses = data["courses"]

        # Update cache
        self._course_cache = (datetime.now(timezone.utc), courses)
        logger.info(f"📚 Found {len(courses)} courses in Hygraph response")

        return courses

    def get_practice_sets(
        self, force_refresh: bool = False
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get practice sets from Hygraph with caching.

        Args:
            force_refresh: If True, bypass cache and fetch fresh data
        """
        # Check cache
        if not force_refresh and self._practice_cache:
            cache_time, cached_data = self._practice_cache
            age = (datetime.now(timezone.utc) - cache_time).total_seconds()
            if age < self._cache_ttl_seconds:
                return cached_data

        # Fetch fresh data
        query = """
        query PracticeSets {
          practiceSets {
            id
            slug
            title
            description
            tag
            questions
            accuracy
            trend
            estimatedTime
          }
        }
        """

        data = self.execute_query(query)
        if not data or "practiceSets" not in data:
            return None

        practice_sets = data["practiceSets"]

        # Update cache
        self._practice_cache = (datetime.now(timezone.utc), practice_sets)

        return practice_sets

    def clear_cache(self):
        """Clear all cached data."""
        self._course_cache = None
        self._practice_cache = None
        logger.info("🧹 Hygraph cache cleared")
