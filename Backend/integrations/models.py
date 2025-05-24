from django.db import models
from django.utils.translation import gettext_lazy as _

class ThirdPartyIntegration(models.Model):
    INTEGRATION_TYPES = (
        ('CREDIT_BUREAU', 'Credit Bureau'),
        ('BANK', 'Bank API'),
        ('IDENTITY_VERIFICATION', 'Identity Verification'),
        ('DOCUMENT_VERIFICATION', 'Document Verification'),
        ('OTHER', 'Other'),
    )
    
    name = models.CharField(max_length=100)
    integration_type = models.CharField(max_length=25, choices=INTEGRATION_TYPES)
    is_active = models.BooleanField(default=True)
    base_url = models.URLField()
    api_key = models.CharField(max_length=255, blank=True)
    secret_key = models.CharField(max_length=255, blank=True)
    auth_method = models.CharField(max_length=50)
    config = models.JSONField(default=dict)
    last_successful_connection = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_integration_type_display()})"

class APILog(models.Model):
    integration = models.ForeignKey(
        ThirdPartyIntegration,
        on_delete=models.CASCADE,
        related_name='api_logs'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    response_time_ms = models.IntegerField()
    request_data = models.JSONField(null=True, blank=True)
    response_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def was_successful(self):
        return 200 <= self.status_code < 300
    
    def __str__(self):
        return f"{self.integration.name} - {self.endpoint} ({self.status_code})"