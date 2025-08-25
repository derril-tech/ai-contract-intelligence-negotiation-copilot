# Created automatically by Cursor AI (2024-12-19)
from celery import Celery
from celery.schedules import crontab
import os

# Celery configuration
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "contract_intelligence_workers",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        "app.workers.doc_ingest",
        "app.workers.structure_parser", 
        "app.workers.clause_matcher",
        "app.workers.playbook_engine",
        "app.workers.redline_engine",
        "app.workers.risk_engine",
        "app.workers.email_ingest",
        "app.workers.signature_adapter",
        "app.workers.obligation_extractor",
        "app.workers.report_generator",
        "app.workers.analytics_aggregator",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    broker_connection_retry_on_startup=True,
)

# Periodic tasks
celery_app.conf.beat_schedule = {
    "daily-renewal-alerts": {
        "task": "app.workers.obligation_extractor.send_renewal_alerts",
        "schedule": crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    "hourly-cost-rollup": {
        "task": "app.workers.analytics_aggregator.rollup_costs",
        "schedule": crontab(minute=0),  # Every hour
    },
    "daily-retention-sweep": {
        "task": "app.workers.analytics_aggregator.retention_sweep",
        "schedule": crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}

if __name__ == "__main__":
    celery_app.start()
