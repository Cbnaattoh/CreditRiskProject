from django.db import models
from django.utils.translation import gettext_lazy as _

class SecurityQuestion(models.Model):
    """
    Predefined security questions for account recovery.
    """
    
    question = models.CharField(
        max_length=255,
        unique=True,
        help_text=_("The security question text")
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_("Whether this question is available for selection")
    )
    
    class Meta:
        verbose_name = _('Security Question')
        verbose_name_plural = _('Security Questions')
        ordering = ['question']
    
    def __str__(self):
        """String representation of the security question"""
        return self.question