from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from .user import User

class UserActivity(models.Model):
    """
    Tracks all user activities for security auditing and analytics.
    """
    
    class ActivityType(models.TextChoices):
        LOGIN_ATTEMPT = 'LOGIN_ATTEMPT', _('Login Attempt')
        LOGIN_SUCCESS = 'LOGIN_SUCCESS', _('Login Success')
        LOGIN_FAILED = 'LOGIN_FAILED', _('Login Failed')
        PASSWORD_CHANGE = 'PASSWORD_CHANGE', _('Password Change')
        PROFILE_UPDATE = 'PROFILE_UPDATE', _('Profile Update')
        ACCOUNT_CREATED = 'ACCOUNT_CREATED', _('Account Created')
        TWO_FA_ENABLED = '2FA_ENABLED', _('2FA Enabled')
        TWO_FA_DISABLED = '2FA_DISABLED', _('2FA Disabled')
        RISK_ASSESSMENT = 'RISK_ASSESSMENT', _('Risk Assessment')
        CREDIT_CHECK = 'CREDIT_CHECK', _('Credit Check')
        LOGOUT = 'LOGOUT', _('Logout')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    activity_type = models.CharField(
        max_length=50,
        choices=ActivityType.choices
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = _('User Activity')
        verbose_name_plural = _('User Activities')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'activity_type']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        """String representation of the activity record"""
        return f"{self.user.email} - {self.get_activity_type_display()} at {self.timestamp}"