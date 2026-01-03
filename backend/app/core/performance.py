"""
Performance Timing Utilities.

Provides decorators and context managers for measuring function execution time.
These help identify slow code paths and track performance improvements.
"""

import time
import logging
import functools
from typing import Callable, TypeVar, Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Type variables for generic decorator typing
F = TypeVar('F', bound=Callable[..., Any])


def timed(func: F) -> F:
    """
    Decorator to measure and log synchronous function execution time.
    
    Usage:
        @timed
        def slow_function():
            time.sleep(1)
            return "done"
    
    Logs:
        slow_function completed in 1000.50ms
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"⏱️ {func.__name__} completed in {elapsed_ms:.2f}ms")
    
    return wrapper  # type: ignore


def async_timed(func: F) -> F:
    """
    Decorator to measure and log async function execution time.
    
    Usage:
        @async_timed
        async def slow_async_function():
            await asyncio.sleep(1)
            return "done"
    
    Logs:
        slow_async_function completed in 1000.50ms
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            return result
        finally:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"⏱️ {func.__name__} completed in {elapsed_ms:.2f}ms")
    
    return wrapper  # type: ignore


def timed_with_threshold(threshold_ms: float = 100.0):
    """
    Decorator to measure function execution time and log if it exceeds threshold.
    
    Only logs slow calls to reduce log noise for fast operations.
    
    Args:
        threshold_ms: Only log if execution exceeds this time (default: 100ms)
    
    Usage:
        @timed_with_threshold(threshold_ms=50)
        def possibly_slow_function():
            # Only logs if this takes > 50ms
            pass
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                if elapsed_ms > threshold_ms:
                    logger.warning(
                        f"⚠️ SLOW: {func.__name__} took {elapsed_ms:.2f}ms "
                        f"(threshold: {threshold_ms}ms)"
                    )
        
        return wrapper  # type: ignore
    
    return decorator


def async_timed_with_threshold(threshold_ms: float = 100.0):
    """
    Async version of timed_with_threshold.
    
    Args:
        threshold_ms: Only log if execution exceeds this time (default: 100ms)
    
    Usage:
        @async_timed_with_threshold(threshold_ms=500)
        async def possibly_slow_async_function():
            # Only logs if this takes > 500ms
            pass
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                if elapsed_ms > threshold_ms:
                    logger.warning(
                        f"⚠️ SLOW: {func.__name__} took {elapsed_ms:.2f}ms "
                        f"(threshold: {threshold_ms}ms)"
                    )
        
        return wrapper  # type: ignore
    
    return decorator


@contextmanager
def timer(operation_name: str, log_level: str = "info"):
    """
    Context manager for timing code blocks.
    
    Usage:
        with timer("database_query"):
            result = db.query(...)
    
    Logs:
        database_query completed in 45.30ms
    """
    start_time = time.perf_counter()
    try:
        yield
    finally:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        log_func = getattr(logger, log_level, logger.info)
        log_func(f"⏱️ {operation_name} completed in {elapsed_ms:.2f}ms")


class PerformanceTracker:
    """
    Utility class for tracking performance metrics across multiple operations.
    
    Usage:
        tracker = PerformanceTracker("chat_request")
        tracker.start("context_building")
        # ... build context ...
        tracker.stop("context_building")
        
        tracker.start("llm_call")
        # ... call LLM ...
        tracker.stop("llm_call")
        
        tracker.log_summary()
    
    Output:
        chat_request Performance Summary:
          - context_building: 150.00ms (25.0%)
          - llm_call: 450.00ms (75.0%)
          - Total: 600.00ms
    """
    
    def __init__(self, name: str):
        self.name = name
        self.timings: dict[str, float] = {}
        self._starts: dict[str, float] = {}
    
    def start(self, operation: str):
        """Start timing an operation."""
        self._starts[operation] = time.perf_counter()
    
    def stop(self, operation: str):
        """Stop timing an operation and record the duration."""
        if operation in self._starts:
            elapsed = (time.perf_counter() - self._starts[operation]) * 1000
            self.timings[operation] = elapsed
            del self._starts[operation]
    
    def get_total_ms(self) -> float:
        """Get total time across all operations."""
        return sum(self.timings.values())
    
    def log_summary(self):
        """Log a summary of all tracked operations."""
        total = self.get_total_ms()
        if total == 0:
            return
        
        lines = [f"\n📊 {self.name} Performance Summary:"]
        for op, ms in sorted(self.timings.items(), key=lambda x: -x[1]):
            pct = (ms / total) * 100
            lines.append(f"  - {op}: {ms:.2f}ms ({pct:.1f}%)")
        lines.append(f"  - Total: {total:.2f}ms")
        
        logger.info("\n".join(lines))
    
    def to_dict(self) -> dict:
        """Return timings as a dictionary for API responses."""
        return {
            "operation": self.name,
            "timings_ms": self.timings.copy(),
            "total_ms": self.get_total_ms(),
        }
