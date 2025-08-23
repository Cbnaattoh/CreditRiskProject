"""
Enterprise notification management tasks for Celery.
Handles background processing, cleanup, and notification delivery at scale.
"""
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count
from datetime import timedelta
import logging

from .models import Notification
from .views import send_notification_to_user

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def cleanup_old_notifications(self, batch_size=1000):
    """
    Enterprise task to clean up old notifications.
    Runs daily to maintain database performance.
    """
    try:
        now = timezone.now()
        total_cleaned = 0
        
        # Policy 1: Read notifications older than 30 days
        read_old = Notification.objects.filter(
            is_read=True,
            created_at__lt=now - timedelta(days=30)
        )
        
        if read_old.exists():
            deleted_count = 0
            while read_old.exists():
                with transaction.atomic():
                    batch_ids = list(read_old.values_list('id', flat=True)[:batch_size])
                    if not batch_ids:
                        break
                    count = Notification.objects.filter(id__in=batch_ids).delete()[0]
                    deleted_count += count
            
            total_cleaned += deleted_count
            logger.info(f"Cleaned {deleted_count} read notifications older than 30 days")
        
        # Policy 2: Unread notifications older than 90 days  
        unread_old = Notification.objects.filter(
            is_read=False,
            created_at__lt=now - timedelta(days=90)
        )
        
        if unread_old.exists():
            deleted_count = 0
            while unread_old.exists():
                with transaction.atomic():
                    batch_ids = list(unread_old.values_list('id', flat=True)[:batch_size])
                    if not batch_ids:
                        break
                    count = Notification.objects.filter(id__in=batch_ids).delete()[0]
                    deleted_count += count
            
            total_cleaned += deleted_count
            logger.info(f"Cleaned {deleted_count} unread notifications older than 90 days")
        
        # Policy 3: All notifications older than 1 year (compliance)
        very_old = Notification.objects.filter(
            created_at__lt=now - timedelta(days=365)
        )
        
        if very_old.exists():
            deleted_count = 0
            while very_old.exists():
                with transaction.atomic():
                    batch_ids = list(very_old.values_list('id', flat=True)[:batch_size])
                    if not batch_ids:
                        break
                    count = Notification.objects.filter(id__in=batch_ids).delete()[0]
                    deleted_count += count
            
            total_cleaned += deleted_count
            logger.info(f"Cleaned {deleted_count} notifications older than 1 year")
        
        logger.info(f"Total notifications cleaned: {total_cleaned}")
        return {
            'success': True,
            'total_cleaned': total_cleaned,
            'message': f'Successfully cleaned {total_cleaned} old notifications'
        }
        
    except Exception as exc:
        logger.error(f"Notification cleanup failed: {str(exc)}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@shared_task(bind=True, max_retries=3)  
def generate_notification_analytics(self):
    """
    Generate analytics about notification usage patterns.
    Helps with capacity planning and retention policy optimization.
    """
    try:
        now = timezone.now()
        
        # Get analytics data
        total_notifications = Notification.objects.count()
        
        # Breakdown by age
        last_24h = Notification.objects.filter(
            created_at__gte=now - timedelta(hours=24)
        ).count()
        
        last_7days = Notification.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count()
        
        last_30days = Notification.objects.filter(
            created_at__gte=now - timedelta(days=30)
        ).count()
        
        # Breakdown by read status
        unread_count = Notification.objects.filter(is_read=False).count()
        read_count = Notification.objects.filter(is_read=True).count()
        
        # Top notification types
        type_stats = list(
            Notification.objects.values('notification_type')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        # Users with most notifications (potential cleanup targets)
        heavy_users = list(
            Notification.objects.values('recipient__email')
            .annotate(count=Count('id'))
            .filter(count__gt=100)
            .order_by('-count')[:20]
        )
        
        analytics = {
            'timestamp': now.isoformat(),
            'total_notifications': total_notifications,
            'breakdown_by_age': {
                'last_24h': last_24h,
                'last_7days': last_7days,
                'last_30days': last_30days,
                'older_than_30days': total_notifications - last_30days
            },
            'breakdown_by_status': {
                'unread': unread_count,
                'read': read_count
            },
            'top_notification_types': type_stats,
            'heavy_users_count': len(heavy_users),
            'heavy_users': heavy_users[:5]  # Only log top 5 for privacy
        }
        
        logger.info(f"Notification analytics generated: {analytics}")
        
        return {
            'success': True,
            'analytics': analytics
        }
        
    except Exception as exc:
        logger.error(f"Notification analytics generation failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@shared_task(bind=True, max_retries=5)
def send_bulk_notification(self, user_ids, notification_type, title, message, 
                          related_object_id=None, related_content_type=None):
    """
    Send notifications to multiple users efficiently.
    Uses bulk create for performance.
    """
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Validate users exist
        valid_users = User.objects.filter(id__in=user_ids)
        if not valid_users.exists():
            logger.warning(f"No valid users found for IDs: {user_ids}")
            return {'success': False, 'error': 'No valid users found'}
        
        # Create notifications in bulk for performance
        notifications = []
        for user in valid_users:
            notifications.append(
                Notification(
                    recipient=user,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    related_object_id=related_object_id,
                    related_content_type=related_content_type
                )
            )
        
        # Bulk create for performance
        created_notifications = Notification.objects.bulk_create(
            notifications, 
            batch_size=1000
        )
        
        # Send real-time notifications (in background)
        for notification in created_notifications:
            send_notification_to_user(
                notification.recipient.id, 
                {
                    'id': notification.id,
                    'type': notification.notification_type,
                    'title': notification.title,
                    'message': notification.message,
                    'created_at': notification.created_at.isoformat()
                }
            )
        
        logger.info(f"Sent bulk notification to {len(created_notifications)} users")
        
        return {
            'success': True,
            'sent_count': len(created_notifications),
            'message': f'Successfully sent notifications to {len(created_notifications)} users'
        }
        
    except Exception as exc:
        logger.error(f"Bulk notification sending failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))

@shared_task
def optimize_notification_database():
    """
    Optimize notification database performance.
    Runs weekly to maintain optimal query performance.
    """
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Update statistics for query planner
            cursor.execute("ANALYZE notifications_notification;")
            
            # Log current table size for monitoring
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_rows,
                    pg_size_pretty(pg_total_relation_size('notifications_notification')) as table_size
                FROM notifications_notification;
            """)
            
            result = cursor.fetchone()
            
        logger.info(f"Notification table stats - Rows: {result[0]}, Size: {result[1]}")
        
        return {
            'success': True,
            'total_rows': result[0],
            'table_size': result[1]
        }
        
    except Exception as exc:
        logger.error(f"Database optimization failed: {str(exc)}")
        return {'success': False, 'error': str(exc)}