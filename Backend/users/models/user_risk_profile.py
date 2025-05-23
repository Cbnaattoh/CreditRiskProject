from django.db import models
from django.utils.translation import gettext_lazy as _
from .user import User

class UserRiskProfile(models.Model):
    """
    Detailed risk assessment profile for users in the credit risk system.
    """
    
    class EmploymentStatus(models.TextChoices):
        EMPLOYED = 'EMPLOYED', _('Employed')
        SELF_EMPLOYED = 'SELF_EMPLOYED', _('Self-Employed')
        UNEMPLOYED = 'UNEMPLOYED', _('Unemployed')
        RETIRED = 'RETIRED', _('Retired')
        STUDENT = 'STUDENT', _('Student')
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='risk_profile'
    )
    credit_score = models.IntegerField(null=True, blank=True)
    debt_to_income_ratio = models.FloatField(null=True, blank=True)
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        blank=True
    )
    annual_income = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    total_debt = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    payment_history = models.JSONField(
        default=list,
        blank=True,
        help_text=_("Historical payment data in JSON format")
    )
    risk_factors = models.JSONField(
        default=list,
        blank=True,
        help_text=_("Identified risk factors in JSON format")
    )
    last_assessment_date = models.DateTimeField(null=True, blank=True)
    next_assessment_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('User Risk Profile')
        verbose_name_plural = _('User Risk Profiles')
        ordering = ['-last_assessment_date']
    
    def __str__(self):
        """String representation of the risk profile"""
        return f"Risk Profile for {self.user.email}"
    
    def calculate_risk_score(self):
        """
        Calculates the user's risk score based on their financial profile.
        
        Note: This should be implemented with your actual risk calculation algorithm.
        """
        # Placeholder implementation - replace with actual logic
        score = 0
        
        # Example scoring factors (simplified)
        if self.credit_score:
            score += min(self.credit_score / 850 * 50, 50)  # Max 50 points for credit score
            
        if self.debt_to_income_ratio:
            if self.debt_to_income_ratio < 0.3:
                score += 30
            elif self.debt_to_income_ratio < 0.5:
                score += 15
            else:
                score += 5
                
        # Update user's risk score
        self.user.risk_score = score
        self.user.save()
        
        return score