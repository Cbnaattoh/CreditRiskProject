"""
ML Processing Notification System
Handles real-time notifications for ML credit scoring progress
"""
import json
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from .models import Notification

logger = logging.getLogger(__name__)


class MLNotificationService:
    """Service for sending ML processing notifications"""
    
    def __init__(self):
        # Initialize channel layer with error handling
        try:
            self.channel_layer = get_channel_layer()
            if self.channel_layer is None:
                logger.error("Channel layer is None - check CHANNEL_LAYERS configuration")
        except Exception as e:
            logger.error(f"Failed to initialize channel layer: {str(e)}")
            self.channel_layer = None
    
    def send_realtime_notification(self, user_id, notification_type, data):
        """Send real-time WebSocket notification"""
        print(f"[ML NOTIFICATIONS] Starting WebSocket notification for user {user_id}, type: {notification_type}")
        logger.info(f"[ML NOTIFICATIONS] Starting WebSocket notification for user {user_id}, type: {notification_type}")
        
        try:
            # Reinitialize channel layer if needed (important for Celery workers)
            if self.channel_layer is None:
                print("[ML NOTIFICATIONS] Channel layer is None, reinitializing...")
                self.channel_layer = get_channel_layer()
                
            if self.channel_layer is None:
                error_msg = "Channel layer is not configured - check Redis connection and CHANNEL_LAYERS settings"
                print(f"[ML NOTIFICATIONS] ERROR: {error_msg}")
                logger.error(f"[ML NOTIFICATIONS] {error_msg}")
                return False
                
            print(f"[ML NOTIFICATIONS] Channel layer initialized: {type(self.channel_layer)}")
            logger.info(f"[ML NOTIFICATIONS] Channel layer initialized: {type(self.channel_layer)}")
                
            group_name = f'notifications_{user_id}'
            message = {
                'type': 'notify',
                'data': {
                    'type': notification_type,
                    'timestamp': timezone.now().isoformat(),
                    **data
                }
            }
            
            print(f"[ML NOTIFICATIONS] Sending to group '{group_name}': {message}")
            logger.info(f"[ML NOTIFICATIONS] Sending to group '{group_name}': {message}")
            
            # Test channel layer connection
            try:
                async_to_sync(self.channel_layer.group_send)(group_name, message)
                success_msg = f"WebSocket message sent successfully to group '{group_name}'"
                print(f"[ML NOTIFICATIONS] SUCCESS: {success_msg}")
                logger.info(f"[ML NOTIFICATIONS] {success_msg}")
                return True
            except Exception as channel_error:
                error_msg = f"Channel layer group_send failed: {str(channel_error)}"
                print(f"[ML NOTIFICATIONS] ERROR: {error_msg}")
                logger.error(f"[ML NOTIFICATIONS] {error_msg}")
                
                # Try to reinitialize and retry once
                print("[ML NOTIFICATIONS] Retrying with fresh channel layer...")
                self.channel_layer = get_channel_layer()
                if self.channel_layer:
                    async_to_sync(self.channel_layer.group_send)(group_name, message)
                    retry_success_msg = f"WebSocket message sent successfully on retry to group '{group_name}'"
                    print(f"[ML NOTIFICATIONS] RETRY SUCCESS: {retry_success_msg}")
                    logger.info(f"[ML NOTIFICATIONS] {retry_success_msg}")
                    return True
                else:
                    raise channel_error
            
        except Exception as e:
            error_details = f"Failed to send WebSocket notification: {str(e)}"
            print(f"[ML NOTIFICATIONS] CRITICAL ERROR: {error_details}")
            print(f"[ML NOTIFICATIONS] Channel layer type: {type(self.channel_layer)}")
            print(f"[ML NOTIFICATIONS] Channel layer config: {getattr(self.channel_layer, 'config', 'No config attribute')}")
            logger.error(f"[ML NOTIFICATIONS] {error_details}")
            logger.error(f"[ML NOTIFICATIONS] Channel layer type: {type(self.channel_layer)}")
            logger.error(f"[ML NOTIFICATIONS] Channel layer config: {getattr(self.channel_layer, 'config', 'No config attribute')}")
            return False
    
    def create_and_send_notification(self, user, notification_type, title, message, 
                                   application_id=None, extra_data=None):
        """Create database notification and send real-time update"""
        print(f"[ML NOTIFICATIONS] create_and_send_notification called: user={user.id}, type={notification_type}, app_id={application_id}")
        
        # Create notification in database
        # Note: Convert UUID to string since related_object_id is CharField in some implementations
        related_object_id = str(application_id) if application_id else None
        
        try:
            notification = Notification.objects.create(
                recipient=user,
                notification_type=notification_type,
                title=title,
                message=message,
                related_object_id=related_object_id,
                related_content_type='creditapplication' if application_id else None
            )
            print(f"[ML NOTIFICATIONS] Database notification created successfully: ID={notification.id}")
        except Exception as e:
            print(f"[ML NOTIFICATIONS] ERROR creating database notification: {str(e)}")
            # Continue with WebSocket notification even if database save fails
            notification = type('MockNotification', (), {'id': 'temp'})()  # Mock object for WebSocket
        
        # Send real-time notification
        notification_data = {
            'id': notification.id,
            'title': title,
            'message': message,
            'application_id': str(application_id) if application_id else None,
            'is_read': False,
            **(extra_data or {})
        }
        
        self.send_realtime_notification(
            user.id,
            notification_type,
            notification_data
        )
        
        return notification
    
    def ml_processing_started(self, user, application):
        """Notify that ML processing has started"""
        print(f"[ML NOTIFICATIONS] ml_processing_started called for user {user.id}, app {application.reference_number}")
        return self.create_and_send_notification(
            user=user,
            notification_type='ML_PROCESSING_STARTED',
            title='Credit Score Processing Started',
            message=f'ML analysis has begun for application {application.reference_number}',
            application_id=application.id,
            extra_data={
                'reference_number': application.reference_number,
                'status': 'PROCESSING'
            }
        )
    
    def ml_processing_completed(self, user, application, ml_assessment):
        """Notify that ML processing has completed successfully"""
        print(f"[ML NOTIFICATIONS] ml_processing_completed called for user {user.id}, app {application.reference_number}, score {ml_assessment.credit_score}")
        return self.create_and_send_notification(
            user=user,
            notification_type='ML_PROCESSING_COMPLETED',
            title='Credit Score Ready',
            message=f'Your credit score ({ml_assessment.credit_score}) has been generated for application {application.reference_number}',
            application_id=application.id,
            extra_data={
                'reference_number': application.reference_number,
                'credit_score': ml_assessment.credit_score,
                'risk_level': ml_assessment.risk_level,
                'confidence': ml_assessment.confidence,
                'status': 'COMPLETED'
            }
        )
    
    def ml_processing_failed(self, user, application, error_message):
        """Notify that ML processing has failed"""
        return self.create_and_send_notification(
            user=user,
            notification_type='ML_PROCESSING_FAILED',
            title='Credit Score Processing Failed',
            message=f'Unable to generate credit score for application {application.reference_number}. Please try again.',
            application_id=application.id,
            extra_data={
                'reference_number': application.reference_number,
                'error_message': error_message,
                'status': 'FAILED'
            }
        )
    
    def credit_score_generated(self, user, application, ml_assessment):
        """Notify specifically about credit score generation"""
        print(f"[ML NOTIFICATIONS] credit_score_generated called for user {user.id}, app {application.reference_number}, score {ml_assessment.credit_score}")
        score_category = self._get_score_category(ml_assessment.credit_score)
        
        return self.create_and_send_notification(
            user=user,
            notification_type='CREDIT_SCORE_GENERATED',
            title=f'Credit Score: {ml_assessment.credit_score} ({score_category})',
            message=f'Your credit assessment is complete. Score: {ml_assessment.credit_score}, Risk Level: {ml_assessment.risk_level}',
            application_id=application.id,
            extra_data={
                'reference_number': application.reference_number,
                'credit_score': ml_assessment.credit_score,
                'category': ml_assessment.category,
                'risk_level': ml_assessment.risk_level,
                'confidence': ml_assessment.confidence,
                'ghana_job_category': ml_assessment.ghana_job_category,
                'employment_score': ml_assessment.ghana_employment_score,
                'status': 'COMPLETED'
            }
        )
    
    def _get_score_category(self, score):
        """Get human-readable category for credit score"""
        if score >= 800:
            return "Exceptional"
        elif score >= 740:
            return "Very Good"
        elif score >= 670:
            return "Good"
        elif score >= 580:
            return "Fair"
        else:
            return "Poor"


# Global instance
ml_notification_service = MLNotificationService()