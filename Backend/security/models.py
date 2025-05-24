from django.db import models
from users.models import User
from django.core.validators import MaxValueValidator, MinValueValidator


class BehavioralBiometrics(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='behavioral_biometrics'
    )
    typing_pattern = models.JSONField(default=dict)
    mouse_movement = models.JSONField(default=dict)
    device_interaction = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        default=0
    )
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Behavioral Profile - {self.user.email}"

class SuspiciousActivity(models.Model):
    ACTIVITY_TYPES = (
        ('LOGIN', 'Login Attempt'),
        ('PASSWORD', 'Password Change'),
        ('APPLICATION', 'Application Change'),
        ('OTHER', 'Other'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='suspicious_activities'
    )
    activity_type = models.CharField(max_length=15, choices=ACTIVITY_TYPES)
    detected_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=255)
    confidence = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    details = models.JSONField()
    was_challenged = models.BooleanField(default=False)
    was_successful = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = "Suspicious Activities"
        ordering = ['-detected_at']
    
    def __str__(self):
        return f"Suspicious {self.get_activity_type_display()} - {self.user.email}"