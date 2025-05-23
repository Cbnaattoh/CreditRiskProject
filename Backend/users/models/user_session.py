from django.db import models
from django.utils.translation import gettext_lazy as _
from datetime import datetime
from .user import User

class UserSession(models.Model):
    """
    Tracks active user sessions for security monitoring and management.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    session_key = models.CharField(max_length=40)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    device_info = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = _('User Session')
        verbose_name_plural = _('User Sessions')
        unique_together = ('user', 'session_key')
        ordering = ['-created_at']
    
    def __str__(self):
        """String representation of the session"""
        status = 'active' if self.is_active else 'expired'
        return f"{self.user.email}'s session ({status})"
    
    def is_expired(self):
        """Checks if the session has expired"""
        return datetime.now() > self.expires_at