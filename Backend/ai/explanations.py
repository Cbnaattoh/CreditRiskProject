from django.db import models
from applications.models import CreditApplication

class RiskExplanation(models.Model):
    application = models.OneToOneField(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='risk_explanation'
    )
    summary = models.TextField()
    key_factors = models.JSONField()  # {factor: {importance: x, direction: y}}
    visualizations = models.JSONField(default=dict)  # Stores chart configs
    generated_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Risk Explanation for {self.application}"

class CounterfactualExplanation(models.Model):
    application = models.ForeignKey(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='counterfactuals'
    )
    scenario = models.CharField(max_length=255)  # e.g., "Higher Income"
    original_score = models.FloatField()
    projected_score = models.FloatField()
    probability_change = models.FloatField()
    required_changes = models.JSONField()  # What needs to change
    explanation = models.TextField()
    
    def __str__(self):
        return f"Counterfactual for {self.application}: {self.scenario}"