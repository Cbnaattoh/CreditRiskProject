from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('APPLICATION_SUBMITTED', 'Application Submitted'),
        ('STATUS_CHANGE', 'Status Change'),
        ('DOCUMENT_UPLOADED', 'Document Uploaded'),
        ('RISK_ASSESSED', 'Risk Assessed'),
        ('DECISION_MADE', 'Decision Made'),
        ('SYSTEM_ALERT', 'System Alert'),
    )
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    related_content_type = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def mark_as_read(self):
        self.is_read = True
        self.save()
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.recipient.email}"

class AuditLog(models.Model):
    ACTION_TYPES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('ACCESS', 'Access'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    action = models.CharField(max_length=10, choices=ACTION_TYPES)
    model = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.get_action_display()} on {self.model} by {self.user or 'System'}"