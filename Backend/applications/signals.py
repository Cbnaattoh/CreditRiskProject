"""
Django Signals for Automated ML Processing and Application Status Tracking
Automatically triggers ML credit assessment and handles status changes with notifications
"""

import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.cache import cache
from django.utils import timezone
from .models import CreditApplication
from .tasks import process_ml_credit_assessment
from users.models import User

logger = logging.getLogger(__name__)


def auto_assign_risk_analyst(application):
    """Automatically assign a risk analyst to the application"""
    try:
        # Get all available risk analysts
        risk_analysts = User.objects.filter(
            user_type='ANALYST',
            is_active=True
        )
        
        if not risk_analysts.exists():
            logger.warning(f"No risk analysts available to assign application {application.id}")
            return None
            
        # Simple round-robin assignment based on current workload
        analyst_workloads = []
        for analyst in risk_analysts:
            # Count applications currently assigned to this analyst that are not completed
            active_applications = CreditApplication.objects.filter(
                assigned_analyst=analyst,
                status__in=['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO']
            ).count()
            analyst_workloads.append((analyst, active_applications))
        
        # Sort by workload (ascending) and assign to analyst with least workload
        analyst_workloads.sort(key=lambda x: x[1])
        selected_analyst = analyst_workloads[0][0]
        
        # Assign the analyst
        application.assigned_analyst = selected_analyst
        application.save(update_fields=['assigned_analyst'])
        
        logger.info(f"Auto-assigned application {application.id} to analyst {selected_analyst.email}")
        return selected_analyst
        
    except Exception as e:
        logger.error(f"Error auto-assigning risk analyst for application {application.id}: {str(e)}")
        return None


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
    logger.info(f"Signal triggered: Application {instance.id}, Status: {instance.status}, Created: {created}")
    
    # For new submitted applications, always process
    if created and instance.status == 'SUBMITTED':
        logger.info(f"New application submitted: {instance.reference_number} - Triggering ML assessment")
        
        # Auto-assign Risk Analyst if not already assigned
        if not instance.assigned_analyst:
            assigned_analyst = auto_assign_risk_analyst(instance)
            if assigned_analyst:
                # Send notification to assigned analyst
                send_analyst_assignment_notification(instance, assigned_analyst)
        
        # Send notifications to all relevant parties
        send_status_update_notifications(instance, 'DRAFT', 'SUBMITTED')
        
        process_ml_credit_assessment.delay(str(instance.id))
        return
    
    # Only trigger ML processing for submitted applications
    if instance.status != 'SUBMITTED':
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


@receiver(post_save, sender=CreditApplication)
def handle_status_change_notifications(sender, instance, created, **kwargs):
    """
    Handle status change notifications for applications.
    """
    # Skip if it's a new application (handled by other signal)
    if created:
        return
    
    try:
        # Get the previous instance to detect status changes
        cache_key = f"app_status_{instance.pk}"
        previous_status = cache.get(cache_key)
        
        if previous_status and previous_status != instance.status:
            logger.info(f"Status changed from {previous_status} to {instance.status} for application {instance.id}")
            
            # Send notifications based on status change
            send_status_update_notifications(instance, previous_status, instance.status)
            
            # Create status history record
            create_status_change_records(instance, previous_status, instance.status)
        
        # Cache current status for next time
        cache.set(cache_key, instance.status, timeout=3600)  # 1 hour
        
    except Exception as e:
        logger.error(f"Failed to handle status change notifications: {str(e)}")


@receiver(pre_save, sender=CreditApplication)
def cache_previous_status(sender, instance, **kwargs):
    """
    Cache the previous status before saving to detect changes.
    """
    if not instance.pk:
        return
        
    try:
        current = CreditApplication.objects.get(pk=instance.pk)
        cache_key = f"app_status_{instance.pk}"
        cache.set(cache_key, current.status, timeout=300)  # 5 minutes
    except CreditApplication.DoesNotExist:
        pass
    except Exception as e:
        logger.error(f"Failed to cache previous status: {str(e)}")


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


# Status Tracking and Notification Functions
def create_status_change_records(application, old_status, new_status, user=None, reason=""):
    """Create status history and activity records for status changes"""
    from .models import ApplicationStatusHistory, ApplicationActivity
    
    # Create status history record
    ApplicationStatusHistory.objects.create(
        application=application,
        previous_status=old_status,
        new_status=new_status,
        changed_by=user,
        reason=reason,
        system_generated=user is None
    )
    
    # Create activity record
    description = f"Status changed from {old_status} to {new_status}"
    if reason:
        description += f" - {reason}"
    
    create_application_activity(
        application,
        'STATUS_CHANGED',
        user,
        description,
        metadata={
            'old_status': old_status,
            'new_status': new_status,
            'reason': reason
        }
    )
    
    # Send notifications based on status change
    send_status_update_notifications(application, old_status, new_status)


def create_application_activity(application, activity_type, user, description, metadata=None):
    """Create an application activity record"""
    from .models import ApplicationActivity
    
    ApplicationActivity.objects.create(
        application=application,
        activity_type=activity_type,
        user=user,
        description=description,
        metadata=metadata or {}
    )




@receiver(post_save, sender='applications.ApplicationReview')
def handle_review_status_change(sender, instance, created, **kwargs):
    """Handle notifications when review status changes"""
    from notifications.models import Notification
    
    if created:
        # Create activity record for new review
        create_application_activity(
            instance.application,
            'REVIEW_STARTED',
            instance.reviewer,
            f"Review started by {instance.reviewer.get_full_name() if instance.reviewer else 'System'}"
        )
        
        # Notify applicant that review has started
        if instance.application.applicant:
            Notification.objects.create(
                recipient=instance.application.applicant,
                notification_type='STATUS_CHANGE',
                title='Review Started',
                message=f'A risk analyst has started reviewing your application {instance.application.reference_number}.',
                related_object_id=str(instance.application.id),
                related_content_type='creditapplication'
            )
    
    # Handle completed reviews
    if instance.review_status == 'COMPLETED' and instance.decision:
        create_application_activity(
            instance.application,
            'REVIEW_COMPLETED',
            instance.reviewer,
            f"Review completed with decision: {instance.get_decision_display()}"
        )


@receiver(post_save, sender='applications.ApplicationComment')
def handle_new_comment(sender, instance, created, **kwargs):
    """Handle notifications for new comments"""
    from notifications.models import Notification
    
    if created:
        # Create activity record
        create_application_activity(
            instance.application,
            'COMMENT_ADDED',
            instance.author,
            f"Comment added by {instance.author.get_full_name() if instance.author else 'System'}"
        )
        
        # Send notifications based on comment type
        if instance.comment_type == 'CLIENT_MESSAGE' and instance.application.assigned_analyst:
            # Client sent message to analyst
            Notification.objects.create(
                recipient=instance.application.assigned_analyst,
                notification_type='STATUS_CHANGE',
                title='New Client Message',
                message=f'Client has sent a message regarding application {instance.application.reference_number}.',
                related_object_id=str(instance.application.id),
                related_content_type='creditapplication'
            )
        
        elif instance.comment_type == 'CLIENT_VISIBLE' and instance.application.applicant:
            # Analyst sent visible message to client
            Notification.objects.create(
                recipient=instance.application.applicant,
                notification_type='STATUS_CHANGE',
                title='Update from Risk Analyst',
                message=f'Your risk analyst has posted an update on application {instance.application.reference_number}.',
                related_object_id=str(instance.application.id),
                related_content_type='creditapplication'
            )


@receiver(post_save, sender='applications.Document')
def handle_document_upload(sender, instance, created, **kwargs):
    """Handle notifications for document uploads"""
    from notifications.models import Notification
    
    if created:
        # Create activity record
        create_application_activity(
            instance.application,
            'DOCUMENT_UPLOADED',
            None,  # Could be system or user
            f"Document uploaded: {instance.get_document_type_display()}"
        )
        
        # Notify assigned analyst about new document
        if instance.application.assigned_analyst:
            Notification.objects.create(
                recipient=instance.application.assigned_analyst,
                notification_type='DOCUMENT_UPLOADED',
                title='New Document Uploaded',
                message=f'A new document has been uploaded for application {instance.application.reference_number}.',
                related_object_id=str(instance.application.id),
                related_content_type='creditapplication'
            )


def send_analyst_assignment_notification(application, analyst):
    """Send notification to analyst when assigned a new application"""
    try:
        from notifications.models import Notification
        
        Notification.objects.create(
            recipient=analyst,
            notification_type='APPLICATION_ASSIGNED',
            title='🎯 New Application Assigned',
            message=f'Application {application.reference_number} has been assigned to you for review. '
                   f'Applicant: {application.applicant.get_full_name() if application.applicant else "Unknown"}',
            related_object_id=str(application.id),
            related_content_type='creditapplication'
        )
        
        logger.info(f"Assignment notification sent to analyst {analyst.email} for application {application.id}")
        
    except Exception as e:
        logger.error(f"Failed to send assignment notification: {str(e)}")


def send_status_update_notifications(application, old_status, new_status):
    """Enhanced notification function to send to all relevant parties"""
    try:
        from notifications.models import Notification
        
        # Notification for applicant
        if application.applicant:
            status_messages = {
                'SUBMITTED': {
                    'title': '✅ Application Submitted Successfully',
                    'message': f'Your credit application {application.reference_number} has been submitted and will be reviewed shortly.',
                    'type': 'APPLICATION_SUBMITTED'
                },
                'UNDER_REVIEW': {
                    'title': '🔍 Review Started',
                    'message': f'A risk analyst has started reviewing your application {application.reference_number}.',
                    'type': 'STATUS_CHANGE'
                },
                'APPROVED': {
                    'title': '🎉 Application Approved!',
                    'message': f'Congratulations! Your credit application {application.reference_number} has been approved.',
                    'type': 'DECISION_MADE'
                },
                'REJECTED': {
                    'title': '❌ Application Decision',
                    'message': f'Your credit application {application.reference_number} has been reviewed. Please check your application for details.',
                    'type': 'DECISION_MADE'
                },
                'NEEDS_INFO': {
                    'title': '📋 Additional Information Required',
                    'message': f'We need additional information for your application {application.reference_number}. Please check your application for details.',
                    'type': 'STATUS_CHANGE'
                }
            }
            
            if new_status in status_messages:
                notification_data = status_messages[new_status]
                Notification.objects.create(
                    recipient=application.applicant,
                    notification_type=notification_data['type'],
                    title=notification_data['title'],
                    message=notification_data['message'],
                    related_object_id=str(application.id),
                    related_content_type='creditapplication'
                )
        
        # Notifications for all Risk Analysts when new applications are submitted
        if new_status == 'SUBMITTED':
            # Send notification to all Risk Analysts about new applications
            risk_analysts = User.objects.filter(user_type='ANALYST', is_active=True)
            for analyst in risk_analysts:
                if analyst != application.assigned_analyst:  # Don't duplicate for assigned analyst
                    Notification.objects.create(
                        recipient=analyst,
                        notification_type='NEW_APPLICATION',
                        title='📋 New Application Available',
                        message=f'New application {application.reference_number} submitted and available for review.',
                        related_object_id=str(application.id),
                        related_content_type='creditapplication'
                    )
        
        logger.info(f"Status update notifications sent for application {application.id}: {old_status} -> {new_status}")
        
    except Exception as e:
        logger.error(f"Failed to send status update notifications: {str(e)}")