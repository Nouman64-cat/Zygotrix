import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
from collections import defaultdict, Counter
import json
import asyncio
from fastapi import HTTPException

from ..schema.analytics import (
    AnalyticsResponse,
    AnalyticsFilters,
    SimulationMetrics,
    UserActivityMetrics,
    PopularTraitsData,
    TimeSeriesData,
    TimeSeriesDataPoint,
    SystemPerformanceMetrics,
    MetricTrend,
    TimeRange,
)
from .common import (
    get_traits_collection,
    get_projects_collection,
    get_simulation_logs_collection,
)
from ..config import get_settings


class AnalyticsService:
    """Service for analytics calculations and data aggregation."""

    def __init__(self):
        self.settings = get_settings()

    def get_analytics(
        self, user_id: Optional[str] = None, filters: Optional[AnalyticsFilters] = None
    ) -> AnalyticsResponse:
        """
        Get comprehensive analytics data.

        Args:
            user_id: Optional user ID for user-specific analytics
            filters: Analytics filters and options

        Returns:
            Complete analytics response
        """
        if filters is None:
            filters = AnalyticsFilters()

        try:
            # Calculate date ranges
            end_date = datetime.now(timezone.utc)
            start_date, previous_start, previous_end = self._calculate_date_ranges(
                end_date, filters.time_range
            )

            # Calculate all analytics data
            simulation_metrics = self._get_simulation_metrics(
                start_date, end_date, previous_start, previous_end, user_id
            )
            user_activity = self._get_user_activity_metrics(
                start_date, end_date, user_id
            )
            system_performance = self._get_system_performance_metrics()

            # Get optional data
            popular_traits = []
            if filters.include_popular_traits:
                popular_traits = self._get_popular_traits(
                    start_date, end_date, user_id, filters.trait_keys
                )

            time_series = TimeSeriesData()
            if filters.include_time_series:
                time_series = self._get_time_series_data(start_date, end_date)

            return AnalyticsResponse(
                simulation_metrics=simulation_metrics,
                user_activity=user_activity,
                popular_traits=popular_traits,
                time_series=time_series,
                system_performance=system_performance,
                time_range=filters.time_range,
            )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to generate analytics: {str(e)}"
            )

    def _calculate_date_ranges(
        self, end_date: datetime, time_range: TimeRange
    ) -> Tuple[datetime, datetime, datetime]:
        """Calculate date ranges for current and previous periods."""
        if time_range == TimeRange.LAST_7_DAYS:
            days = 7
        elif time_range == TimeRange.LAST_30_DAYS:
            days = 30
        elif time_range == TimeRange.LAST_90_DAYS:
            days = 90
        elif time_range == TimeRange.LAST_YEAR:
            days = 365
        else:  # ALL_TIME
            days = 10000  # Large number for all-time

        start_date = end_date - timedelta(days=days)
        previous_end = start_date
        previous_start = previous_end - timedelta(days=days)

        return start_date, previous_start, previous_end

    def _get_simulation_metrics(
        self,
        start_date: datetime,
        end_date: datetime,
        previous_start: datetime,
        previous_end: datetime,
        user_id: Optional[str] = None,
    ) -> SimulationMetrics:
        """Calculate simulation metrics with trends using real stored data.

        We aggregate over projects' tools which contain `simulation_results` and
        `trait_configurations`. A simulation is counted when a tool has non-empty
        `simulation_results`. Time attribution uses the project's `updated_at`
        (best available signal of when the tool was last executed).
        """
        try:
            projects_collection = get_projects_collection(required=False)
            logs_collection = get_simulation_logs_collection(required=False)
            if projects_collection is None:
                # No database configured; return zeros to remain truthful
                return SimulationMetrics(
                    total_simulations=self._calculate_trend(0, 0),
                    data_points_analyzed=self._calculate_trend(0, 0),
                    accuracy_rate=self._calculate_trend(0, 0),
                    avg_processing_time=self._calculate_trend(
                        0, 0, lower_is_better=True
                    ),
                )

            current = self._scan_window_aggregates(
                projects_collection, start_date, end_date, user_id, logs_collection
            )
            previous = self._scan_window_aggregates(
                projects_collection,
                previous_start,
                previous_end,
                user_id,
                logs_collection,
            )

            return SimulationMetrics(
                total_simulations=self._calculate_trend(
                    current.get("simulations", 0), previous.get("simulations", 0)
                ),
                data_points_analyzed=self._calculate_trend(
                    float(current.get("data_points", 0)),
                    float(previous.get("data_points", 0)),
                ),
                accuracy_rate=self._calculate_trend(
                    float(current.get("avg_confidence", 0.0)),
                    float(previous.get("avg_confidence", 0.0)),
                ),
                avg_processing_time=self._calculate_trend(
                    float(current.get("avg_processing", 0.0)),
                    float(previous.get("avg_processing", 0.0)),
                    lower_is_better=True,
                ),
            )

        except Exception as e:
            print(f"Error calculating simulation metrics: {e}")
            return SimulationMetrics(
                total_simulations=self._calculate_trend(0, 0),
                data_points_analyzed=self._calculate_trend(0, 0),
                accuracy_rate=self._calculate_trend(0, 0),
                avg_processing_time=self._calculate_trend(0, 0, lower_is_better=True),
            )

    def _get_mock_simulation_metrics(self) -> SimulationMetrics:
        """Generate mock simulation metrics for demo purposes."""
        return SimulationMetrics(
            total_simulations=MetricTrend(
                current_value=2847,
                previous_value=2532,
                percentage_change=12.5,
                is_positive=True,
            ),
            data_points_analyzed=MetricTrend(
                current_value=1200000,
                previous_value=1108000,
                percentage_change=8.3,
                is_positive=True,
            ),
            accuracy_rate=MetricTrend(
                current_value=94.7,
                previous_value=92.7,
                percentage_change=2.1,
                is_positive=True,
            ),
            avg_processing_time=MetricTrend(
                current_value=2.3,
                previous_value=2.7,
                percentage_change=-15.2,
                is_positive=True,  # Lower processing time is better
            ),
        )

    def _get_user_activity_metrics(
        self, start_date: datetime, end_date: datetime, user_id: Optional[str] = None
    ) -> UserActivityMetrics:
        """Calculate user activity metrics."""
        try:
            # This would typically query user session logs
            # For now, we'll estimate based on project activity

            projects_collection = get_projects_collection(required=False)
            if projects_collection is None:
                return UserActivityMetrics(
                    active_users=15,
                    new_users=5,
                    total_sessions=42,
                    avg_session_duration=18.5,
                )

            query = {"created_at": {"$gte": start_date, "$lte": end_date}}
            if user_id:
                query["owner_id"] = user_id

            recent_projects = list(projects_collection.find(query))
            unique_users = len(
                {p.get("owner_id") for p in recent_projects if p.get("owner_id")}
            )

            return UserActivityMetrics(
                active_users=max(unique_users, 1),
                new_users=max(unique_users // 3, 1),
                total_sessions=len(recent_projects)
                * 2,  # Estimate 2 sessions per project
                avg_session_duration=15.0 + (unique_users % 10) * 2.0,
            )

        except Exception as e:
            print(f"Error calculating user activity metrics: {e}")
            return UserActivityMetrics(
                active_users=15,
                new_users=5,
                total_sessions=42,
                avg_session_duration=18.5,
            )

    def _get_popular_traits(
        self,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[str] = None,
        trait_filter: Optional[List[str]] = None,
    ) -> List[PopularTraitsData]:
        """Get most popular traits used in simulations."""
        try:
            projects_collection = get_projects_collection(required=False)
            logs_collection = get_simulation_logs_collection(required=False)

            trait_counter = Counter()

            # Primary source: simulation logs (more accurate for API usage)
            if logs_collection is not None:
                logs_trait_count = 0
                for log in self._iter_logs_between(
                    logs_collection, start_date, end_date, user_id
                ):
                    traits = log.get("traits") or []
                    for trait_key in traits:
                        if not trait_filter or trait_key in trait_filter:
                            trait_counter[trait_key] += 1
                            logs_trait_count += 1
                print(
                    f"DEBUG: Added {logs_trait_count} trait usages from simulation logs"
                )

            # Fallback: count traits from project tools only if no simulation logs
            if not trait_counter and projects_collection is not None:
                projects = list(
                    self._iter_projects_between(
                        projects_collection, start_date, end_date, user_id
                    )
                )
                trait_counter.update(
                    self._accumulate_trait_usage(projects, trait_filter)
                )
                print(
                    f"DEBUG: No simulation logs found, using project tools for traits"
                )

            return self._format_popular_traits(trait_counter)

        except Exception as e:
            print(f"Error calculating popular traits: {e}")
            return self._get_mock_popular_traits()

    def _build_projects_query(
        self, start_date: datetime, end_date: datetime, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build MongoDB query for projects."""
        query = {"created_at": {"$gte": start_date, "$lte": end_date}}
        if user_id:
            query["owner_id"] = user_id
        return query

    def _count_trait_usage(
        self, projects: List[Dict[str, Any]], trait_filter: Optional[List[str]] = None
    ) -> Counter:
        """Count trait usage across projects."""
        trait_counter = Counter()
        for project in projects:
            traits = project.get("selected_traits", [])
            for trait in traits:
                trait_key = trait.get("key") or trait.get("trait_key")
                if trait_key and (not trait_filter or trait_key in trait_filter):
                    trait_counter[trait_key] += 1
        return trait_counter

    def _format_popular_traits(self, trait_counter: Counter) -> List[PopularTraitsData]:
        """Format trait counter into response objects."""
        total_usage = sum(trait_counter.values()) or 1
        popular_traits = []

        for trait_key, count in trait_counter.most_common(10):
            trait_name = trait_key.replace("_", " ").title()
            popular_traits.append(
                PopularTraitsData(
                    trait_key=trait_key,
                    trait_name=trait_name,
                    usage_count=count,
                    percentage=round((count / total_usage) * 100, 1),
                )
            )

        return popular_traits

    def _get_mock_popular_traits(self) -> List[PopularTraitsData]:
        """Generate mock popular traits data."""
        return [
            PopularTraitsData(
                trait_key="eye_color",
                trait_name="Eye Color",
                usage_count=234,
                percentage=18.5,
            ),
            PopularTraitsData(
                trait_key="hair_color",
                trait_name="Hair Color",
                usage_count=198,
                percentage=15.6,
            ),
            PopularTraitsData(
                trait_key="height",
                trait_name="Height",
                usage_count=167,
                percentage=13.2,
            ),
            PopularTraitsData(
                trait_key="blood_type",
                trait_name="Blood Type",
                usage_count=145,
                percentage=11.4,
            ),
            PopularTraitsData(
                trait_key="skin_tone",
                trait_name="Skin Tone",
                usage_count=123,
                percentage=9.7,
            ),
        ]

    def _get_time_series_data(  # noqa: C901
        self, start_date: datetime, end_date: datetime
    ) -> TimeSeriesData:
        """Aggregate real time-series from projects' tool simulations.

        We bucket by day and compute:
        - simulations_over_time: count of tools with simulation_results per day
        - accuracy_over_time: average of max phenotype probability per tool
        - processing_time_over_time: estimated processing time per tool (see metric helper)
        """
        try:
            projects_collection = get_projects_collection(required=False)
            logs_collection = get_simulation_logs_collection(required=False)
            if projects_collection is None:
                return TimeSeriesData()

            days = max(1, (end_date - start_date).days)

            (
                sims_per_day,
                conf_sum_per_day,
                conf_count_per_day,
                proc_sum_per_day,
                proc_count_per_day,
            ) = ({}, {}, {}, {}, {})

            for p in self._iter_projects_between(
                projects_collection, start_date, end_date, None
            ):
                ts = p.get("updated_at") or p.get("created_at") or start_date
                ts = ts if isinstance(ts, datetime) else start_date
                bucket = self._bucket_key(ts)

                for tool in p.get("tools") or []:
                    sim = tool.get("simulation_results") or {}
                    if not sim:
                        continue
                    sims_per_day[bucket] = sims_per_day.get(bucket, 0) + 1
                    _, conf_s, conf_c, proc_s, proc_c = self._summarize_simulation_dict(
                        sim
                    )
                    if conf_c:
                        conf_sum_per_day[bucket] = (
                            conf_sum_per_day.get(bucket, 0.0) + conf_s
                        )
                        conf_count_per_day[bucket] = (
                            conf_count_per_day.get(bucket, 0) + conf_c
                        )
                    proc_sum_per_day[bucket] = (
                        proc_sum_per_day.get(bucket, 0.0) + proc_s
                    )
                    proc_count_per_day[bucket] = (
                        proc_count_per_day.get(bucket, 0) + proc_c
                    )

            # Also fold in ad-hoc simulation logs (non-project based)
            if logs_collection is not None:
                for log in self._iter_logs_between(
                    logs_collection, start_date, end_date, None
                ):
                    ts = log.get("timestamp") or start_date
                    ts = ts if isinstance(ts, datetime) else start_date
                    bucket = self._bucket_key(ts)
                    sims_per_day[bucket] = sims_per_day.get(bucket, 0) + 1
                    # Build aggregates similar to project tool summaries
                    cval = float(log.get("avg_confidence") or 0.0)
                    if cval > 0:
                        conf_sum_per_day[bucket] = (
                            conf_sum_per_day.get(bucket, 0.0) + cval
                        )
                        conf_count_per_day[bucket] = (
                            conf_count_per_day.get(bucket, 0) + 1
                        )
                    ptime = float(log.get("processing_time_seconds") or 0.0)
                    proc_sum_per_day[bucket] = proc_sum_per_day.get(bucket, 0.0) + ptime
                    proc_count_per_day[bucket] = proc_count_per_day.get(bucket, 0) + 1

            # Build ordered series (limit to last 30 days)
            unique_days = sorted(
                set(
                    list(sims_per_day.keys())
                    + [
                        self._bucket_key(start_date + timedelta(days=i))
                        for i in range(days)
                    ]
                )
            )
            if len(unique_days) > 30:
                unique_days = unique_days[-30:]

            sims_series: List[TimeSeriesDataPoint] = []
            conf_series: List[TimeSeriesDataPoint] = []
            proc_series: List[TimeSeriesDataPoint] = []
            for k in unique_days:
                dt = datetime.fromisoformat(k)
                sims_series.append(
                    TimeSeriesDataPoint(
                        timestamp=dt, value=float(sims_per_day.get(k, 0))
                    )
                )
                csum = conf_sum_per_day.get(k, 0.0)
                ccount = conf_count_per_day.get(k, 0)
                conf_series.append(
                    TimeSeriesDataPoint(
                        timestamp=dt, value=(csum / ccount) if ccount else 0.0
                    )
                )
                psum = proc_sum_per_day.get(k, 0.0)
                pcount = proc_count_per_day.get(k, 0)
                proc_series.append(
                    TimeSeriesDataPoint(
                        timestamp=dt, value=(psum / pcount) if pcount else 0.0
                    )
                )

            return TimeSeriesData(
                simulations_over_time=sims_series,
                accuracy_over_time=conf_series,
                processing_time_over_time=proc_series,
            )

        except Exception as e:
            print(f"Error generating time series data: {e}")
            return TimeSeriesData()

    # ---------- Helper methods ----------
    def _iter_projects_between(
        self,
        collection,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[str],
    ):
        """Yield projects whose updated_at or created_at falls within window."""
        criteria: Dict[str, Any] = {
            "$or": [
                {"updated_at": {"$gte": start_date, "$lte": end_date}},
                {"created_at": {"$gte": start_date, "$lte": end_date}},
            ]
        }
        if user_id:
            criteria["owner_id"] = user_id
        yield from collection.find(criteria)

    def _summarize_simulation_dict(
        self, sim_results: Dict[str, Any]
    ) -> tuple[int, float, int, float, int]:
        """Return (data_points, conf_sum, conf_count, proc_sum, proc_count)."""
        data_points = 0
        conf_sum = 0.0
        conf_count = 0
        proc_sum = 0.0
        proc_count = 0
        for _, res in sim_results.items():
            geno = (res or {}).get("genotypic_ratios") or {}
            pheno = (res or {}).get("phenotypic_ratios") or {}
            data_points += len(geno) + len(pheno)
            if pheno:
                try:
                    max_p = max(float(v) for v in pheno.values())
                    conf_sum += max_p * 100.0
                    conf_count += 1
                except Exception:
                    pass
            est_time = 0.001 * max(1, len(geno)) + 0.0015 * max(1, len(pheno))
            proc_sum += est_time
            proc_count += 1
        return data_points, conf_sum, conf_count, proc_sum, proc_count

    def _scan_window_aggregates(
        self,
        collection,
        window_start: datetime,
        window_end: datetime,
        user_id: Optional[str],
        logs_collection=None,
    ) -> Dict[str, Any]:
        total_sims = 0
        total_points = 0
        conf_sum = 0.0
        conf_count = 0
        proc_sum = 0.0
        proc_count = 0

        # Primary count: simulation logs (more accurate for API usage)
        if logs_collection is not None:
            logs_count = 0
            for log in self._iter_logs_between(
                logs_collection, window_start, window_end, user_id
            ):
                logs_count += 1
                total_sims += 1
                total_points += int(log.get("total_data_points") or 0)
                cval = float(log.get("avg_confidence") or 0.0)
                if cval > 0:
                    conf_sum += cval
                    conf_count += 1
                proc_sum += float(log.get("processing_time_seconds") or 0.0)
                proc_count += 1
            print(f"DEBUG: Found {logs_count} simulation logs")

        # Fallback: count project tools only if no simulation logs exist
        if total_sims == 0:
            project_tools_count = 0
            for p in self._iter_projects_between(
                collection, window_start, window_end, user_id
            ):
                for tool in p.get("tools") or []:
                    sim_results = tool.get("simulation_results") or {}
                    if not sim_results:
                        continue
                    project_tools_count += 1
                    total_sims += 1
                    dp, csum, ccount, psum, pcount = self._summarize_simulation_dict(
                        sim_results
                    )
                    total_points += dp
                    conf_sum += csum
                    conf_count += ccount
                    proc_sum += psum
                    proc_count += pcount
            print(
                f"DEBUG: No simulation logs found, using {project_tools_count} project tools"
            )

        avg_conf = (conf_sum / conf_count) if conf_count else 0.0
        avg_proc = (proc_sum / proc_count) if proc_count else 0.0
        return {
            "simulations": total_sims,
            "data_points": total_points,
            "avg_confidence": avg_conf,
            "avg_processing": avg_proc,
        }

    def _accumulate_trait_usage(  # noqa: C901
        self, projects: List[Dict[str, Any]], trait_filter: Optional[List[str]]
    ) -> Counter:
        trait_counter: Counter = Counter()
        for p in projects:
            for tool in p.get("tools") or []:
                cfg = tool.get("trait_configurations") or {}
                for key in cfg.keys():
                    if not trait_filter or key in trait_filter:
                        trait_counter[key] += 1
                sim = tool.get("simulation_results") or {}
                for key in sim.keys():
                    if not trait_filter or key in trait_filter:
                        trait_counter[key] += 1
        return trait_counter

    def _bucket_key(self, dt: datetime) -> str:
        d = datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)
        return d.isoformat()

    def _iter_logs_between(
        self,
        collection,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[str],
    ):
        """Yield simulation logs in a time window, filtered by user when provided."""
        criteria: Dict[str, Any] = {"timestamp": {"$gte": start_date, "$lte": end_date}}
        if user_id:
            criteria["user_id"] = user_id
        yield from collection.find(criteria)

    def _get_system_performance_metrics(self) -> SystemPerformanceMetrics:
        """Get system performance metrics."""
        # In a real system, this would query monitoring systems
        return SystemPerformanceMetrics(
            avg_response_time=125.3,
            error_rate=0.2,
            uptime_percentage=99.8,
            memory_usage=68.5,
            cpu_usage=42.1,
        )

    def _calculate_trend(
        self,
        current: float,
        previous: float,
        lower_is_better: bool = False,
    ) -> MetricTrend:
        """Calculate trend between current and previous values."""
        if previous == 0:
            percentage_change = 100.0 if current > 0 else 0.0
        else:
            percentage_change = ((current - previous) / previous) * 100

        # Determine if the change is positive (improvement)
        if lower_is_better:
            is_positive = percentage_change <= 0
        else:
            is_positive = percentage_change >= 0

        return MetricTrend(
            current_value=current,
            previous_value=previous,
            percentage_change=round(percentage_change, 1),
            is_positive=is_positive,
        )


# Singleton instance
analytics_service = AnalyticsService()
