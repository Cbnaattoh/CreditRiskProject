from django.db import models
from applications.models import CreditApplication
import uuid

class AIModelVersion(models.Model):
    MODEL_TYPES = (
        ('RISK_SCORE', 'Risk Scoring'),
        ('FRAUD_DETECTION', 'Fraud Detection'),
        ('BEHAVIORAL', 'Behavioral Analysis'),
        ('RECOMMENDATION', 'Recommendation Engine'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    model_type = models.CharField(max_length=20, choices=MODEL_TYPES)
    version = models.CharField(max_length=50)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    performance_metrics = models.JSONField(default=dict)
    training_data_range = models.CharField(max_length=100, blank=True)
    
    class Meta:
        unique_together = ('name', 'version')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} v{self.version}"

class ModelTrainingLog(models.Model):
    model_version = models.ForeignKey(
        AIModelVersion,
        on_delete=models.CASCADE,
        related_name='training_logs'
    )
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='RUNNING')
    parameters = models.JSONField()
    metrics = models.JSONField(default=dict)
    training_data_size = models.IntegerField()
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def duration(self):
        if self.completed_at:
            return self.completed_at - self.started_at
        return None
    
    def __str__(self):
        return f"Training {self.model_version} - {self.status}"

class FeatureImportance(models.Model):
    model_version = models.ForeignKey(
        AIModelVersion,
        on_delete=models.CASCADE,
        related_name='feature_importances'
    )
    feature_name = models.CharField(max_length=100)
    importance_score = models.FloatField()
    direction = models.CharField(max_length=10) 
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['model_version', '-importance_score']
    
    def __str__(self):
        return f"{self.feature_name} for {self.model_version}"