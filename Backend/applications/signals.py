"""
Django Signals for Automated ML Processing
Automatically triggers ML credit assessment when applications are submitted or updated
"""

import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.cache import cache
from .models import CreditApplication
from .tasks import process_ml_credit_assessment

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CreditApplication)
def trigger_ml_assessment_on_submission(sender, instance, created, **kwargs):
    """
    Trigger ML assessment when application is submitted or significantly updated.
    
    Args:
        sender: CreditApplication model class
        instance: CreditApplication instance
        created: True if this is a new instance
        **kwargs: Additional signal arguments
    """
    # Only trigger ML processing for submitted applications
    if instance.status != 'SUBMITTED':
        return
    
    # For new submitted applications, always process
    if created:
        logger.info(f"New application submitted: {instance.reference_number} - Triggering ML assessment")
        process_ml_credit_assessment.delay(str(instance.id))
        return
    
    # For updated applications, check if ML-relevant fields changed
    if _has_ml_relevant_changes(instance):
        logger.info(f"ML-relevant changes detected for {instance.reference_number} - Triggering ML reassessment")
        process_ml_credit_assessment.delay(str(instance.id), force_reprocess=True)


@receiver(pre_save, sender=CreditApplication)
def cache_previous_ml_data(sender, instance, **kwargs):
    """
    Cache previous ML-relevant data before save to detect changes.
    
    Args:
        sender: CreditApplication model class
        instance: CreditApplication instance
        **kwargs: Additional signal arguments
    """
    # Only cache for existing instances
    if not instance.pk:
        return
    
    try:
        # Get current instance from database
        current = CreditApplication.objects.get(pk=instance.pk)
        
        # Cache ML-relevant fields
        ml_fields = {
            'annual_income': current.annual_income,
            'debt_to_income_ratio': current.debt_to_income_ratio,
            'interest_rate': current.interest_rate,
            'revolving_utilization': current.revolving_utilization,
            'delinquencies_2yr': current.delinquencies_2yr,
            'inquiries_6mo': current.inquiries_6mo,
            'employment_length': current.employment_length,
            'open_accounts': current.open_accounts,
            'collections_12mo': current.collections_12mo,
            'loan_amount': current.loan_amount,
            'credit_history_length': current.credit_history_length,
            'max_bankcard_balance': current.max_bankcard_balance,
            'total_accounts': current.total_accounts,
            'revolving_accounts_12mo': current.revolving_accounts_12mo,
            'public_records': current.public_records,
            'home_ownership': current.home_ownership,
            'job_title': current.job_title,
            'status': current.status
        }
        
        cache_key = f"ml_fields_{instance.pk}"
        cache.set(cache_key, ml_fields, timeout=300)  # 5 minutes
        
    except CreditApplication.DoesNotExist:
        # Instance doesn't exist yet, skip caching
        pass
    except Exception as e:
        logger.error(f"Failed to cache ML fields for application {instance.pk}: {str(e)}")


def _has_ml_relevant_changes(instance):
    """
    Check if ML-relevant fields have changed significantly.
    
    Args:
        instance: CreditApplication instance
        
    Returns:
        True if ML-relevant changes detected, False otherwise
    """
    cache_key = f"ml_fields_{instance.pk}"
    previous_fields = cache.get(cache_key)
    
    if not previous_fields:
        return False
    
    # List of fields that trigger ML reprocessing if changed
    ml_sensitive_fields = [
        'annual_income',
        'debt_to_income_ratio',
        'loan_amount',
        'credit_history_length',
        'employment_length',
        'job_title',
        'revolving_utilization',
        'delinquencies_2yr',
        'home_ownership'
    ]
    
    # Check for significant changes
    changes_detected = []
    
    for field in ml_sensitive_fields:
        current_value = getattr(instance, field)
        previous_value = previous_fields.get(field)
        
        # Check if values are significantly different
        if _is_significant_change(field, previous_value, current_value):
            changes_detected.append(f"{field}: {previous_value} -> {current_value}")
    
    if changes_detected:
        logger.info(f"ML-relevant changes detected for {instance.reference_number}: {', '.join(changes_detected)}")
        return True
    
    return False


def _is_significant_change(field_name, old_value, new_value):
    """
    Determine if a field change is significant enough to trigger ML reprocessing.
    
    Args:
        field_name: Name of the field
        old_value: Previous value
        new_value: Current value
        
    Returns:
        True if change is significant, False otherwise
    """
    # Handle None values
    if old_value is None and new_value is None:
        return False
    if old_value is None or new_value is None:
        return True
    
    # String fields - any change is significant
    if isinstance(new_value, str):
        return str(old_value).strip() != str(new_value).strip()
    
    # Numeric fields - check for significant percentage change
    if isinstance(new_value, (int, float)) and isinstance(old_value, (int, float)):
        if old_value == 0:
            return new_value != 0
        
        # Calculate percentage change
        percentage_change = abs((new_value - old_value) / old_value) * 100
        
        # Different thresholds for different fields
        thresholds = {
            'annual_income': 10,  # 10% change
            'debt_to_income_ratio': 5,  # 5% change
            'loan_amount': 10,  # 10% change
            'credit_history_length': 15,  # 15% change
            'revolving_utilization': 10,  # 10% change
            'delinquencies_2yr': 0,  # Any change
            'max_bankcard_balance': 20,  # 20% change
        }
        
        threshold = thresholds.get(field_name, 15)  # Default 15%
        return percentage_change >= threshold
    
    # For other types, any change is significant
    return old_value != new_value


@receiver(post_save, sender=CreditApplication)
def cleanup_ml_cache(sender, instance, **kwargs):
    """
    Clean up cached ML fields after processing.
    
    Args:
        sender: CreditApplication model class
        instance: CreditApplication instance
        **kwargs: Additional signal arguments
    """
    cache_key = f"ml_fields_{instance.pk}"
    cache.delete(cache_key)


# Manual trigger functions for admin/API use
def trigger_manual_ml_assessment(application_id, force_reprocess=False):
    """
    Manually trigger ML assessment for an application.
    
    Args:
        application_id: UUID or ID of the application
        force_reprocess: Force reprocessing even if assessment exists
        
    Returns:
        Celery task result
    """
    logger.info(f"Manual ML assessment triggered for application {application_id}")
    return process_ml_credit_assessment.delay(str(application_id), force_reprocess)


def trigger_batch_ml_assessment(application_ids, force_reprocess=False):
    """
    Manually trigger batch ML assessment for multiple applications.
    
    Args:
        application_ids: List of application UUIDs/IDs
        force_reprocess: Force reprocessing even if assessments exist
        
    Returns:
        Celery task result
    """
    from .tasks import batch_process_ml_assessments
    
    logger.info(f"Manual batch ML assessment triggered for {len(application_ids)} applications")
    return batch_process_ml_assessments.delay(application_ids, force_reprocess)