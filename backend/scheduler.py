"""
Scheduler Service for GARVIS OpenClaw
Provides scheduled task execution (heartbeats/cron jobs)
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class SchedulerService:
    """Manages scheduled task executions"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scheduled_jobs = {}
        
    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Scheduler service started")
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler service stopped")
    
    async def add_scheduled_task(
        self, 
        schedule_id: str,
        task_id: str,
        cron_expression: str,
        execute_callback,
        enabled: bool = True
    ):
        """Add a scheduled task using cron expression"""
        
        # Remove existing job if any
        if schedule_id in self.scheduled_jobs:
            self.remove_scheduled_task(schedule_id)
        
        if not enabled:
            logger.info(f"Schedule {schedule_id} is disabled, not adding to scheduler")
            return
        
        try:
            # Parse cron expression (minute hour day month day_of_week)
            parts = cron_expression.split()
            if len(parts) != 5:
                raise ValueError("Cron expression must have 5 parts: minute hour day month day_of_week")
            
            trigger = CronTrigger(
                minute=parts[0],
                hour=parts[1],
                day=parts[2],
                month=parts[3],
                day_of_week=parts[4]
            )
            
            job = self.scheduler.add_job(
                execute_callback,
                trigger=trigger,
                id=schedule_id,
                args=[task_id],
                replace_existing=True
            )
            
            self.scheduled_jobs[schedule_id] = job
            logger.info(f"Added scheduled task {schedule_id} with cron: {cron_expression}")
            
        except Exception as e:
            logger.error(f"Failed to add scheduled task {schedule_id}: {e}")
            raise
    
    async def add_interval_task(
        self,
        schedule_id: str,
        task_id: str,
        interval_seconds: int,
        execute_callback,
        enabled: bool = True
    ):
        """Add a task that runs at fixed intervals"""
        
        # Remove existing job if any
        if schedule_id in self.scheduled_jobs:
            self.remove_scheduled_task(schedule_id)
        
        if not enabled:
            logger.info(f"Schedule {schedule_id} is disabled, not adding to scheduler")
            return
        
        try:
            trigger = IntervalTrigger(seconds=interval_seconds)
            
            job = self.scheduler.add_job(
                execute_callback,
                trigger=trigger,
                id=schedule_id,
                args=[task_id],
                replace_existing=True
            )
            
            self.scheduled_jobs[schedule_id] = job
            logger.info(f"Added interval task {schedule_id} every {interval_seconds}s")
            
        except Exception as e:
            logger.error(f"Failed to add interval task {schedule_id}: {e}")
            raise
    
    def remove_scheduled_task(self, schedule_id: str):
        """Remove a scheduled task"""
        try:
            if schedule_id in self.scheduled_jobs:
                self.scheduler.remove_job(schedule_id)
                del self.scheduled_jobs[schedule_id]
                logger.info(f"Removed scheduled task {schedule_id}")
        except Exception as e:
            logger.error(f"Failed to remove scheduled task {schedule_id}: {e}")
    
    def get_job_info(self, schedule_id: str):
        """Get information about a scheduled job"""
        job = self.scheduled_jobs.get(schedule_id)
        if job:
            return {
                "id": job.id,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            }
        return None
    
    def list_jobs(self):
        """List all scheduled jobs"""
        return [
            {
                "id": job.id,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            }
            for job in self.scheduler.get_jobs()
        ]


# Global scheduler instance
scheduler_service = SchedulerService()
