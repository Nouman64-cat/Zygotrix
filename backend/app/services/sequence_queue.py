"""
Sequence Generation Queue Service

Manages concurrent large sequence generation requests to prevent server overload.
Uses Redis for queue management and job status tracking.
"""

import json
import logging
import threading
import time
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, Optional

from app.utils.redis_client import get_redis_client

logger = logging.getLogger(__name__)

# Queue configuration
LARGE_SEQUENCE_THRESHOLD = 10_000_000  # 10M bp - sequences above this use queue
# With parallel C++ generation, we can handle 2 concurrent jobs
# Each job uses multi-threaded generation, more memory efficient
MAX_CONCURRENT_LARGE_JOBS = 2
JOB_TTL_SECONDS = 3600  # Job data expires after 1 hour
JOB_HISTORY_TTL_SECONDS = 86400 * 7  # Job history expires after 7 days
QUEUE_KEY = "seq:queue"
ACTIVE_JOBS_KEY = "seq:active_count"
JOB_PREFIX = "seq:job:"
JOB_HISTORY_KEY = "seq:job_history"  # Sorted set for job history
PROCESSING_JOBS_KEY = "seq:processing"  # Set of currently processing job IDs


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SequenceQueueService:
    """Service for managing sequence generation queue."""

    _instance = None
    _lock = threading.Lock()
    _processing_lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._local_processing = False  # Fallback if Redis unavailable
        self._job_processor: Optional[Callable[[Dict[str, Any]], None]] = None
        logger.info("🚀 SequenceQueueService initialized")

    def set_job_processor(self, processor: Callable[[Dict[str, Any]], None]):
        """
        Set the callback function to process queued jobs.
        This should be called during app startup.
        
        Args:
            processor: A function that takes job_data dict and processes it
        """
        self._job_processor = processor
        logger.info("📌 Job processor callback registered")

    def process_next_queued_job(self):
        """
        Check if there's a queued job and process it.
        Called automatically when a job completes or fails.
        """
        client = self._get_client()
        
        if client is None:
            return
        
        try:
            # Check if we have capacity
            active = int(client.get(ACTIVE_JOBS_KEY) or 0)
            if active >= MAX_CONCURRENT_LARGE_JOBS:
                logger.debug("⏳ Queue is still at capacity, waiting...")
                return
            
            # Get next job from queue
            next_job = self.get_next_queued_job()
            if next_job is None:
                logger.debug("📭 No jobs in queue")
                return
            
            job_id = next_job.get("job_id")
            logger.info(f"📤 Dequeuing job {job_id} for processing")
            
            # Mark it as processing
            self.mark_processing(job_id)
            
            # Process in background thread
            if self._job_processor:
                thread = threading.Thread(
                    target=self._run_job_processor,
                    args=(next_job,),
                    daemon=True
                )
                thread.start()
                logger.info(f"🧵 Started background thread for job {job_id}")
            else:
                logger.error("❌ No job processor registered! Job will remain stuck.")
                self.fail_job(job_id, "No job processor available")
                
        except Exception as e:
            logger.error(f"Failed to process next job: {e}")
    
    def _run_job_processor(self, job_data: Dict[str, Any]):
        """Run the job processor in a background thread."""
        try:
            if self._job_processor:
                self._job_processor(job_data)
        except Exception as e:
            job_id = job_data.get("job_id", "unknown")
            logger.error(f"Job processor failed for {job_id}: {e}")
            self.fail_job(job_id, str(e))

    def _get_client(self):
        """Get Redis client, returns None if unavailable."""
        return get_redis_client()

    def is_large_sequence(self, length: int) -> bool:
        """Check if sequence length requires queueing."""
        return length >= LARGE_SEQUENCE_THRESHOLD

    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status with job details."""
        client = self._get_client()

        if client is None:
            # Fallback: no queue, immediate processing
            return {
                "queue_enabled": False,
                "active_jobs": 1 if self._local_processing else 0,
                "queue_length": 0,
                "estimated_wait_seconds": 0,
                "queued_jobs": [],
                "processing_jobs": [],
            }

        try:
            active = int(client.get(ACTIVE_JOBS_KEY) or 0)
            
            # Get queued jobs with details
            queue_items = client.lrange(QUEUE_KEY, 0, -1)
            queued_jobs = []
            for item in queue_items:
                try:
                    job_data = json.loads(item)
                    queued_jobs.append({
                        "job_id": job_data.get("job_id"),
                        "sequence_length": job_data.get("request", {}).get("length", 0),
                        "created_at": job_data.get("created_at"),
                    })
                except Exception:
                    pass
            
            # Get processing jobs
            processing_job_ids = client.smembers(PROCESSING_JOBS_KEY)
            processing_jobs = []
            for job_id in processing_job_ids:
                job_key = f"{JOB_PREFIX}{job_id}"
                job_json = client.get(job_key)
                if job_json:
                    try:
                        job_data = json.loads(job_json)
                        processing_jobs.append({
                            "job_id": job_data.get("job_id"),
                            "sequence_length": job_data.get("request", {}).get("length", 0),
                            "created_at": job_data.get("created_at"),
                        })
                    except Exception:
                        pass

            queue_length = len(queued_jobs)
            # Estimate ~6 minutes per large job (based on 100M bp benchmark)
            estimated_wait = queue_length * 360

            return {
                "queue_enabled": True,
                "active_jobs": active,
                "queue_length": queue_length,
                "estimated_wait_seconds": estimated_wait,
                "queued_jobs": queued_jobs,
                "processing_jobs": processing_jobs,
            }
        except Exception as e:
            logger.error(f"Failed to get queue status: {e}")
            return {
                "queue_enabled": False,
                "active_jobs": 0,
                "queue_length": 0,
                "estimated_wait_seconds": 0,
                "queued_jobs": [],
                "processing_jobs": [],
            }

    def can_process_immediately(self, length: int) -> bool:
        """Check if a job can be processed immediately."""
        # Small sequences always process immediately
        if not self.is_large_sequence(length):
            return True

        client = self._get_client()

        if client is None:
            # Fallback: use local flag
            return not self._local_processing

        try:
            active = int(client.get(ACTIVE_JOBS_KEY) or 0)
            return active < MAX_CONCURRENT_LARGE_JOBS
        except Exception as e:
            logger.error(f"Failed to check queue: {e}")
            return not self._local_processing

    def create_job(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new job. Returns job info with status.

        If can process immediately, returns status='processing'.
        Otherwise, returns status='queued' with queue position.
        """
        job_id = str(uuid.uuid4())[:8]
        length = request_data.get("length", 0)

        job_data = {
            "job_id": job_id,
            "request": request_data,
            "status": JobStatus.QUEUED.value,
            "created_at": datetime.utcnow().isoformat(),
            "queue_position": 0,
            "result": None,
            "error": None,
        }

        # Small sequences don't need queueing
        if not self.is_large_sequence(length):
            job_data["status"] = JobStatus.PROCESSING.value
            return job_data

        client = self._get_client()

        if client is None:
            # Fallback: simple local check
            if self._local_processing:
                job_data["status"] = JobStatus.QUEUED.value
                job_data["queue_position"] = 1
                logger.info(f"📋 Job {job_id} queued (local fallback)")
            else:
                job_data["status"] = JobStatus.PROCESSING.value
            return job_data

        try:
            # Check if we can process immediately
            active = int(client.get(ACTIVE_JOBS_KEY) or 0)

            if active < MAX_CONCURRENT_LARGE_JOBS:
                # Can process immediately
                job_data["status"] = JobStatus.PROCESSING.value
                job_data["started_at"] = datetime.utcnow().isoformat()
                client.incr(ACTIVE_JOBS_KEY)
                # Track this job as processing
                client.sadd(PROCESSING_JOBS_KEY, job_id)
                logger.info(f"🚀 Job {job_id} starting immediately ({length:,} bp)")
            else:
                # Add to queue
                client.rpush(QUEUE_KEY, json.dumps(job_data))
                queue_position = client.llen(QUEUE_KEY)
                job_data["queue_position"] = queue_position
                logger.info(f"📋 Job {job_id} queued at position {queue_position} ({length:,} bp)")

            # Store job data
            client.setex(
                f"{JOB_PREFIX}{job_id}",
                JOB_TTL_SECONDS,
                json.dumps(job_data)
            )

            return job_data

        except Exception as e:
            logger.error(f"Failed to create job: {e}")
            # Fallback: allow processing
            job_data["status"] = JobStatus.PROCESSING.value
            return job_data

    def mark_processing(self, job_id: str):
        """Mark a job as processing (when dequeued)."""
        client = self._get_client()

        if client is None:
            self._local_processing = True
            return

        try:
            job_key = f"{JOB_PREFIX}{job_id}"
            job_json = client.get(job_key)
            if job_json:
                job_data = json.loads(job_json)
                job_data["status"] = JobStatus.PROCESSING.value
                job_data["started_at"] = datetime.utcnow().isoformat()
                client.setex(job_key, JOB_TTL_SECONDS, json.dumps(job_data))

            client.incr(ACTIVE_JOBS_KEY)
            # Track this job as processing
            client.sadd(PROCESSING_JOBS_KEY, job_id)
            logger.info(f"🔄 Job {job_id} now processing")
        except Exception as e:
            logger.error(f"Failed to mark job processing: {e}")
            self._local_processing = True

    def complete_job(self, job_id: str, result: Dict[str, Any]):
        """Mark a job as completed with result."""
        client = self._get_client()

        if client is None:
            self._local_processing = False
            return

        try:
            job_key = f"{JOB_PREFIX}{job_id}"
            job_json = client.get(job_key)

            if job_json:
                job_data = json.loads(job_json)
                job_data["status"] = JobStatus.COMPLETED.value
                completed_at = datetime.utcnow()
                job_data["completed_at"] = completed_at.isoformat()
                job_data["result"] = result
                
                # Calculate duration
                if job_data.get("started_at"):
                    started = datetime.fromisoformat(job_data["started_at"])
                    job_data["duration_seconds"] = (completed_at - started).total_seconds()
                
                client.setex(job_key, JOB_TTL_SECONDS, json.dumps(job_data))
                
                # Save to history (without the full result to save space)
                self._save_to_history(client, job_data)

            # Decrement active count
            client.decr(ACTIVE_JOBS_KEY)
            # Remove from processing set
            client.srem(PROCESSING_JOBS_KEY, job_id)
            # Ensure it doesn't go negative
            if int(client.get(ACTIVE_JOBS_KEY) or 0) < 0:
                client.set(ACTIVE_JOBS_KEY, 0)

            logger.info(f"✅ Job {job_id} completed")

        except Exception as e:
            logger.error(f"Failed to complete job: {e}")
            self._local_processing = False
        
        # Process next queued job if any
        self.process_next_queued_job()

    def fail_job(self, job_id: str, error: str):
        """Mark a job as failed."""
        client = self._get_client()

        if client is None:
            self._local_processing = False
            return

        try:
            job_key = f"{JOB_PREFIX}{job_id}"
            job_json = client.get(job_key)

            if job_json:
                job_data = json.loads(job_json)
                job_data["status"] = JobStatus.FAILED.value
                completed_at = datetime.utcnow()
                job_data["completed_at"] = completed_at.isoformat()
                job_data["error"] = error
                
                # Calculate duration
                if job_data.get("started_at"):
                    started = datetime.fromisoformat(job_data["started_at"])
                    job_data["duration_seconds"] = (completed_at - started).total_seconds()
                
                client.setex(job_key, JOB_TTL_SECONDS, json.dumps(job_data))
                
                # Save to history
                self._save_to_history(client, job_data)

            # Decrement active count
            client.decr(ACTIVE_JOBS_KEY)
            # Remove from processing set
            client.srem(PROCESSING_JOBS_KEY, job_id)
            if int(client.get(ACTIVE_JOBS_KEY) or 0) < 0:
                client.set(ACTIVE_JOBS_KEY, 0)

            logger.warning(f"❌ Job {job_id} failed: {error}")

        except Exception as e:
            logger.error(f"Failed to mark job as failed: {e}")
            self._local_processing = False
        
        # Process next queued job if any
        self.process_next_queued_job()

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job status and result if available."""
        client = self._get_client()

        if client is None:
            return None

        try:
            job_json = client.get(f"{JOB_PREFIX}{job_id}")
            if job_json:
                job_data = json.loads(job_json)

                # Update queue position if still queued
                if job_data["status"] == JobStatus.QUEUED.value:
                    # Find position in queue
                    queue_items = client.lrange(QUEUE_KEY, 0, -1)
                    for i, item in enumerate(queue_items):
                        item_data = json.loads(item)
                        if item_data.get("job_id") == job_id:
                            job_data["queue_position"] = i + 1
                            break

                return job_data
            return None
        except Exception as e:
            logger.error(f"Failed to get job status: {e}")
            return None

    def get_next_queued_job(self) -> Optional[Dict[str, Any]]:
        """Get and remove the next job from the queue."""
        client = self._get_client()

        if client is None:
            return None

        try:
            job_json = client.lpop(QUEUE_KEY)
            if job_json:
                return json.loads(job_json)
            return None
        except Exception as e:
            logger.error(f"Failed to get next job: {e}")
            return None

    def _save_to_history(self, client, job_data: Dict[str, Any]):
        """Save a completed/failed job to history (without full result)."""
        try:
            # Create a lightweight history entry
            history_entry = {
                "job_id": job_data.get("job_id"),
                "status": job_data.get("status"),
                "sequence_length": job_data.get("request", {}).get("length", 0),
                "created_at": job_data.get("created_at"),
                "started_at": job_data.get("started_at"),
                "completed_at": job_data.get("completed_at"),
                "duration_seconds": job_data.get("duration_seconds"),
                "error": job_data.get("error"),
            }
            
            # Use current timestamp as score for sorting (newest first)
            timestamp = time.time()
            client.zadd(JOB_HISTORY_KEY, {json.dumps(history_entry): timestamp})
            
            # Trim old entries (keep last 1000)
            client.zremrangebyrank(JOB_HISTORY_KEY, 0, -1001)
            
            logger.debug(f"📝 Job {job_data.get('job_id')} saved to history")
        except Exception as e:
            logger.error(f"Failed to save job to history: {e}")

    def get_job_history(self, limit: int = 50) -> Dict[str, Any]:
        """Get job history for admin monitoring."""
        client = self._get_client()
        
        if client is None:
            return {
                "jobs": [],
                "total_jobs": 0,
                "completed_jobs": 0,
                "failed_jobs": 0,
                "queued_jobs": 0,
                "processing_jobs": 0,
                "avg_duration_seconds": None,
                "total_bp_processed": 0,
            }
        
        try:
            # Get job history (sorted by timestamp, newest first)
            history_items = client.zrevrange(JOB_HISTORY_KEY, 0, limit - 1)
            
            jobs = []
            completed_jobs = 0
            failed_jobs = 0
            total_duration = 0.0
            duration_count = 0
            total_bp = 0
            
            for item in history_items:
                job = json.loads(item)
                jobs.append(job)
                
                if job.get("status") == JobStatus.COMPLETED.value:
                    completed_jobs += 1
                    if job.get("duration_seconds"):
                        total_duration += job["duration_seconds"]
                        duration_count += 1
                    if job.get("sequence_length"):
                        total_bp += job["sequence_length"]
                elif job.get("status") == JobStatus.FAILED.value:
                    failed_jobs += 1
            
            # Get current queue stats
            active = int(client.get(ACTIVE_JOBS_KEY) or 0)
            queue_length = client.llen(QUEUE_KEY)
            total_in_history = client.zcard(JOB_HISTORY_KEY)
            
            avg_duration = total_duration / duration_count if duration_count > 0 else None
            
            return {
                "jobs": jobs,
                "total_jobs": total_in_history,
                "completed_jobs": completed_jobs,
                "failed_jobs": failed_jobs,
                "queued_jobs": queue_length,
                "processing_jobs": active,
                "avg_duration_seconds": round(avg_duration, 2) if avg_duration else None,
                "total_bp_processed": total_bp,
            }
            
        except Exception as e:
            logger.error(f"Failed to get job history: {e}")
            return {
                "jobs": [],
                "total_jobs": 0,
                "completed_jobs": 0,
                "failed_jobs": 0,
                "queued_jobs": 0,
                "processing_jobs": 0,
                "avg_duration_seconds": None,
                "total_bp_processed": 0,
            }


# Singleton instance
queue_service = SequenceQueueService()
