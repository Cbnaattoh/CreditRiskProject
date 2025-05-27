from django.db import models
from applications.models import CreditApplication
from django.core.validators import MinValueValidator, MaxValueValidator

class RiskAssessment(models.Model):
    application = models.OneToOneField(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='risk_assessment'
    )
    risk_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        null=True,
        blank=True
    )
    risk_rating = models.CharField(max_length=20, blank=True)
    probability_of_default = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        null=True,
        blank=True
    )
    expected_loss = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    last_updated = models.DateTimeField(auto_now=True)
    reviewed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'user_type__in': ['ANALYST', 'ADMIN']}
    )
    review_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-last_updated']
    
    def save(self, *args, **kwargs):
        if self.risk_score is not None:
            self._calculate_risk_rating()
        super().save(*args, **kwargs)
    
    def _calculate_risk_rating(self):
        if self.risk_score >= 800:
            self.risk_rating = 'Very Low'
        elif 600 <= self.risk_score < 800:
            self.risk_rating = 'Low'
        elif 400 <= self.risk_score < 600:
            self.risk_rating = 'Moderate'
        elif 200 <= self.risk_score < 400:
            self.risk_rating = 'High'
        else:
            self.risk_rating = 'Very High'
    
    def __str__(self):
        return f"Risk Assessment for {self.application.reference_number}"

class RiskFactor(models.Model):
    assessment = models.ForeignKey(
        RiskAssessment,
        on_delete=models.CASCADE,
        related_name='risk_factors'
    )
    factor_name = models.CharField(max_length=100)
    factor_weight = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    factor_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    notes = models.TextField(blank=True)
    
    @property
    def weighted_score(self):
        return self.factor_score * self.factor_weight
    
    def __str__(self):
        return f"{self.factor_name} - {self.weighted_score}"

class Decision(models.Model):
    DECISION_CHOICES = (
        ('APPROVE', 'Approve'),
        ('DECLINE', 'Decline'),
        ('REFER', 'Refer for Manual Review'),
        ('CONDITIONAL', 'Conditional Approval'),
    )
    
    application = models.OneToOneField(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='decision'
    )
    decision = models.CharField(max_length=15, choices=DECISION_CHOICES)
    decision_date = models.DateTimeField(auto_now_add=True)
    decision_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='decisions_made'
    )
    amount_approved = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    interest_rate = models.FloatField(
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    term_months = models.IntegerField(
        validators=[MinValueValidator(1)],
        null=True,
        blank=True
    )
    conditions = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.get_decision_display()} - {self.application.reference_number}"

class CreditScore(models.Model):
    SCORE_TYPES = (
        ('FICO', 'FICO Score'),
        ('VANTAGE', 'VantageScore'),
        ('INTERNAL', 'Internal Score'),
    )
    
    applicant = models.ForeignKey(
        'applications.Applicant',
        on_delete=models.CASCADE,
        related_name='credit_scores'
    )
    score_type = models.CharField(max_length=10, choices=SCORE_TYPES)
    score = models.IntegerField(
        validators=[MinValueValidator(300), MaxValueValidator(850)]
    )
    report_date = models.DateField()
    provider = models.CharField(max_length=100)
    factors = models.JSONField(default=dict)  # Stores positive/negative factors
    
    class Meta:
        ordering = ['-report_date']
    
    def __str__(self):
        return f"{self.get_score_type_display()} - {self.score} ({self.report_date})"

class ModelPrediction(models.Model):
    application = models.ForeignKey(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='predictions'
    )
    model_version = models.CharField(max_length=50)
    prediction_date = models.DateTimeField(auto_now_add=True)
    prediction = models.JSONField()  # Stores raw prediction output
    confidence = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    explanation = models.TextField(blank=True)
    
    def __str__(self):
        return f"Prediction for {self.application.reference_number} (v{self.model_version})"
    

class RiskExplanation(models.Model):
    """
    Model to store explainable AI results for risk assessments.
    Provides human-readable explanations of risk factors.
    """
    application = models.OneToOneField(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='risk_explanation'
    )
    summary = models.TextField(
        help_text="Natural language summary of the risk assessment"
    )
    key_factors = models.JSONField(
        help_text="JSON structure of important risk factors and their impact"
    )
    visualizations = models.JSONField(
        default=dict,
        help_text="Configuration data for risk visualization charts"
    )
    generated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this explanation was generated"
    )
    
    class Meta:
        verbose_name = "Risk Explanation"
        verbose_name_plural = "Risk Explanations"
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"Risk Explanation for {self.application.reference_number}"

    @property
    def primary_factors(self):
        """Returns top 3 most significant risk factors"""
        if not self.key_factors:
            return []
        
        sorted_factors = sorted(
            self.key_factors.items(),
            key=lambda x: abs(x[1]['importance']),
            reverse=True
        )
        return sorted_factors[:3]



class CounterfactualExplanation(models.Model):
    """
    Model to store "what-if" scenarios showing how changes would affect the risk assessment.
    """
    application = models.ForeignKey(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='counterfactuals'
    )
    scenario = models.CharField(
        max_length=255,
        help_text="Description of the hypothetical scenario"
    )
    original_score = models.FloatField(
        help_text="Original risk score before changes"
    )
    projected_score = models.FloatField(
        help_text="Projected risk score after changes"
    )
    probability_change = models.FloatField(
        help_text="Change in default probability"
    )
    required_changes = models.JSONField(
        help_text="What factors would need to change to achieve this scenario"
    )
    explanation = models.TextField(
        help_text="Detailed explanation of the scenario and its impact"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this counterfactual was generated"
    )
    
    class Meta:
        verbose_name = "Counterfactual Explanation"
        verbose_name_plural = "Counterfactual Explanations"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Counterfactual for {self.application}: {self.scenario}"

    @property
    def score_change(self):
        """Calculates the difference in risk scores"""
        return self.projected_score - self.original_score

    @property
    def improvement_percentage(self):
        """Calculates percentage improvement in risk score"""
        if self.original_score == 0:
            return 0
        return (self.score_change / self.original_score) * 100