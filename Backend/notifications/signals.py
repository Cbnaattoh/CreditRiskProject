"""
Enterprise notification signals for automatic lifecycle management.
Implements industry best practices for notification handling.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Notification
from .tasks import cleanup_old_notifications

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    """
    Handle notification creation events.
    Implements enterprise monitoring and alerting.
    """
    if created:
        logger.info(
            f"Notification created: {instance.notification_type} for {instance.recipient.email}"
        )
        
        # Monitor notification volume for potential abuse/spam
        recent_notifications = Notification.objects.filter(
            recipient=instance.recipient,
            created_at__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        if recent_notifications > 50:  # Configurable threshold
            logger.warning(
                f"High notification volume detected for user {instance.recipient.email}: "
                f"{recent_notifications} notifications in 5 minutes"
            )
            
        # Trigger cleanup if notification count is getting high
        total_count = Notification.objects.count()
        if total_count > 100000:  # Configurable threshold
            logger.info(f"High notification count detected: {total_count}. Triggering cleanup.")
            # Schedule cleanup task (non-blocking)
            cleanup_old_notifications.delay()

@receiver(post_delete, sender=Notification)
def notification_deleted(sender, instance, **kwargs):
    """
    Handle notification deletion for audit trail.
    """
    logger.debug(
        f"Notification deleted: {instance.notification_type} for {instance.recipient.email}"
    )