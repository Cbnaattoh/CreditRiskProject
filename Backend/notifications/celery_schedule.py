"""
Celery scheduled tasks configuration for enterprise notification management.
Add this to your main celery.py file's CELERYBEAT_SCHEDULE.
"""

from celery.schedules import crontab

# Add these to your CELERYBEAT_SCHEDULE in backend/celery.py
NOTIFICATION_CELERY_SCHEDULE = {
    # Daily cleanup at 2 AM (low traffic time)
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=2, minute=0),  # 2:00 AM daily
        'options': {
            'expires': 3600,  # Task expires after 1 hour
            'retry_policy': {
                'max_retries': 3,
                'interval_start': 60,
                'interval_step': 60,
                'interval_max': 300
            }
        }
    },
    
    # Weekly analytics report - Sunday at 3 AM
    'generate-notification-analytics': {
        'task': 'notifications.tasks.generate_notification_analytics', 
        'schedule': crontab(hour=3, minute=0, day_of_week=0),  # Sunday 3:00 AM
        'options': {
            'expires': 7200,  # Task expires after 2 hours
        }
    },
    
    # Weekly database optimization - Saturday at 1 AM  
    'optimize-notification-database': {
        'task': 'notifications.tasks.optimize_notification_database',
        'schedule': crontab(hour=1, minute=0, day_of_week=6),  # Saturday 1:00 AM
        'options': {
            'expires': 3600,
        }
    },
}