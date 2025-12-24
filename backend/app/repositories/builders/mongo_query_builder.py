"""
MongoDB Query Builder.

Builder pattern for constructing MongoDB queries with fluent API.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
from datetime import datetime


class MongoQueryBuilder:
    """
    Builder for MongoDB queries using fluent interface.

    Provides a clean, readable way to construct complex MongoDB queries
    with filtering, sorting, pagination, and projections.

    Example:
        query = (MongoQueryBuilder()
            .with_field("status", "active")
            .with_regex("name", "test")
            .sorted_by("created_at", descending=True)
            .paginated(page=1, page_size=20)
            .build())
    """

    def __init__(self):
        """Initialize empty query builder."""
        self._filter: Dict[str, Any] = {}
        self._sort: Optional[List[Tuple[str, int]]] = None
        self._limit: Optional[int] = None
        self._skip: Optional[int] = None
        self._projection: Optional[Dict[str, int]] = None

    def with_field(self, field: str, value: Any) -> "MongoQueryBuilder":
        """
        Add exact match filter for a field.

        Args:
            field: Field name to filter on
            value: Value to match exactly

        Returns:
            Self for method chaining

        Example:
            builder.with_field("status", "active")
        """
        self._filter[field] = value
        return self

    def with_fields(self, **kwargs) -> "MongoQueryBuilder":
        """
        Add multiple exact match filters.

        Args:
            **kwargs: Field-value pairs to filter on

        Returns:
            Self for method chaining

        Example:
            builder.with_fields(status="active", is_verified=True)
        """
        self._filter.update(kwargs)
        return self

    def with_regex(
        self, field: str, pattern: str, case_insensitive: bool = True
    ) -> "MongoQueryBuilder":
        """
        Add regex filter for a field.

        Args:
            field: Field name to filter on
            pattern: Regex pattern to match
            case_insensitive: Whether to ignore case (default: True)

        Returns:
            Self for method chaining

        Example:
            builder.with_regex("email", ".*@example.com")
        """
        regex_query: Dict[str, Any] = {"$regex": pattern}
        if case_insensitive:
            regex_query["$options"] = "i"
        self._filter[field] = regex_query
        return self

    def with_in(self, field: str, values: List[Any]) -> "MongoQueryBuilder":
        """
        Add $in filter for a field.

        Args:
            field: Field name to filter on
            values: List of values to match

        Returns:
            Self for method chaining

        Example:
            builder.with_in("status", ["active", "pending"])
        """
        self._filter[field] = {"$in": values}
        return self

    def with_not_in(self, field: str, values: List[Any]) -> "MongoQueryBuilder":
        """
        Add $nin (not in) filter for a field.

        Args:
            field: Field name to filter on
            values: List of values to exclude

        Returns:
            Self for method chaining

        Example:
            builder.with_not_in("status", ["deleted", "archived"])
        """
        self._filter[field] = {"$nin": values}
        return self

    def with_greater_than(self, field: str, value: Any) -> "MongoQueryBuilder":
        """
        Add greater than filter.

        Args:
            field: Field name
            value: Value to compare against

        Returns:
            Self for method chaining

        Example:
            builder.with_greater_than("age", 18)
        """
        self._filter[field] = {"$gt": value}
        return self

    def with_greater_than_or_equal(
        self, field: str, value: Any
    ) -> "MongoQueryBuilder":
        """Add greater than or equal filter."""
        self._filter[field] = {"$gte": value}
        return self

    def with_less_than(self, field: str, value: Any) -> "MongoQueryBuilder":
        """Add less than filter."""
        self._filter[field] = {"$lt": value}
        return self

    def with_less_than_or_equal(self, field: str, value: Any) -> "MongoQueryBuilder":
        """Add less than or equal filter."""
        self._filter[field] = {"$lte": value}
        return self

    def with_date_range(
        self,
        field: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> "MongoQueryBuilder":
        """
        Add date range filter.

        Args:
            field: Date field name
            start_date: Start of range (inclusive)
            end_date: End of range (inclusive)

        Returns:
            Self for method chaining

        Example:
            builder.with_date_range("created_at", start_date=datetime(2024, 1, 1))
        """
        date_filter: Dict[str, datetime] = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date

        if date_filter:
            self._filter[field] = date_filter
        return self

    def with_or(self, conditions: List[Dict[str, Any]]) -> "MongoQueryBuilder":
        """
        Add OR conditions.

        Args:
            conditions: List of condition dictionaries

        Returns:
            Self for method chaining

        Example:
            builder.with_or([
                {"status": "active"},
                {"is_premium": True}
            ])
        """
        if conditions:
            self._filter["$or"] = conditions
        return self

    def with_and(self, conditions: List[Dict[str, Any]]) -> "MongoQueryBuilder":
        """Add AND conditions."""
        if conditions:
            self._filter["$and"] = conditions
        return self

    def with_exists(self, field: str, exists: bool = True) -> "MongoQueryBuilder":
        """
        Add exists filter (check if field exists).

        Args:
            field: Field name
            exists: True to check field exists, False to check it doesn't

        Returns:
            Self for method chaining

        Example:
            builder.with_exists("deleted_at", exists=False)
        """
        self._filter[field] = {"$exists": exists}
        return self

    def with_text_search(self, search_text: str) -> "MongoQueryBuilder":
        """
        Add full-text search.

        Args:
            search_text: Text to search for

        Returns:
            Self for method chaining

        Note:
            Requires text index on the collection

        Example:
            builder.with_text_search("genetics dna")
        """
        self._filter["$text"] = {"$search": search_text}
        return self

    def sorted_by(
        self, field: str, descending: bool = False
    ) -> "MongoQueryBuilder":
        """
        Add sorting by a field.

        Args:
            field: Field name to sort by
            descending: True for descending, False for ascending

        Returns:
            Self for method chaining

        Example:
            builder.sorted_by("created_at", descending=True)
        """
        if self._sort is None:
            self._sort = []
        direction = -1 if descending else 1
        self._sort.append((field, direction))
        return self

    def paginated(self, page: int, page_size: int) -> "MongoQueryBuilder":
        """
        Add pagination.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Self for method chaining

        Example:
            builder.paginated(page=2, page_size=20)  # Skip first 20, get next 20
        """
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 1

        self._skip = (page - 1) * page_size
        self._limit = page_size
        return self

    def limit(self, count: int) -> "MongoQueryBuilder":
        """
        Limit number of results.

        Args:
            count: Maximum number of results

        Returns:
            Self for method chaining
        """
        self._limit = count
        return self

    def skip(self, count: int) -> "MongoQueryBuilder":
        """
        Skip number of results.

        Args:
            count: Number of results to skip

        Returns:
            Self for method chaining
        """
        self._skip = count
        return self

    def with_projection(self, fields: List[str], include: bool = True) -> "MongoQueryBuilder":
        """
        Add field projection (select specific fields).

        Args:
            fields: List of field names
            include: True to include these fields, False to exclude

        Returns:
            Self for method chaining

        Example:
            builder.with_projection(["name", "email"], include=True)
        """
        if self._projection is None:
            self._projection = {}

        value = 1 if include else 0
        for field in fields:
            self._projection[field] = value
        return self

    def build(self) -> Dict[str, Any]:
        """
        Build and return the complete query object.

        Returns:
            Dictionary containing:
            - filter: MongoDB filter document
            - sort: Sort specification (or None)
            - limit: Limit value (or None)
            - skip: Skip value (or None)
            - projection: Field projection (or None)

        Example:
            result = builder.build()
            cursor = collection.find(
                result["filter"],
                projection=result["projection"]
            ).sort(result["sort"]).skip(result["skip"]).limit(result["limit"])
        """
        return {
            "filter": self._filter,
            "sort": self._sort,
            "limit": self._limit,
            "skip": self._skip,
            "projection": self._projection,
        }

    def build_filter_only(self) -> Dict[str, Any]:
        """
        Build and return only the filter document.

        Returns:
            MongoDB filter document

        Example:
            filter_doc = builder.build_filter_only()
            results = collection.find(filter_doc)
        """
        return self._filter

    def reset(self) -> "MongoQueryBuilder":
        """
        Reset the builder to initial state.

        Returns:
            Self for method chaining
        """
        self._filter = {}
        self._sort = None
        self._limit = None
        self._skip = None
        self._projection = None
        return self
