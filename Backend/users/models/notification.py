from django.db import models
from django.utils.translation import gettext_lazy as _
from .user import User

class Notification(models.Model):
    """
    System notifications for users, including security alerts and system messages.
    """
    
    class NotificationType(models.TextChoices):
        SYSTEM = 'SYSTEM', _('System Notification')
        SECURITY = 'SECURITY', _('Security Alert')
        RISK = 'RISK', _('Risk Alert')
        PAYMENT = 'PAYMENT', _('Payment Notification')
        GENERAL = 'GENERAL', _('General Message')
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        """String representation of the notification"""
        return f"{self.get_notification_type_display()} notification for {self.user.email}"
    
    def mark_as_read(self):
        """Marks the notification as read"""
        self.is_read = True
        self.save()