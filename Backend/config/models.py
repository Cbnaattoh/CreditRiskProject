from django.db import models

class SystemSetting(models.Model):
    SETTING_TYPES = (
        ('GENERAL', 'General'),
        ('RISK', 'Risk Parameters'),
        ('NOTIFICATION', 'Notification'),
        ('INTEGRATION', 'Integration'),
        ('AI', 'AI Model'),
    )
    
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    setting_type = models.CharField(max_length=15, choices=SETTING_TYPES)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    
    def __str__(self):
        return self.key

class RiskParameter(models.Model):
    PARAMETER_TYPES = (
        ('SCORE_WEIGHT', 'Score Weight'),
        ('THRESHOLD', 'Threshold'),
        ('RULE', 'Business Rule'),
    )
    
    name = models.CharField(max_length=100)
    parameter_type = models.CharField(max_length=15, choices=PARAMETER_TYPES)
    value = models.JSONField()
    applies_to = models.CharField(max_length=100)  # Which model/process this applies to
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_parameter_type_display()})"