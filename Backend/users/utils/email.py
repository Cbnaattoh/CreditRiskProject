from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.urls import reverse
import logging

logger = logging.getLogger(__name__)


def send_welcome_email(user):
    """Send welcome email to new user"""
    try:
        subject = f'Welcome to {getattr(settings, "APP_NAME", "RiskGuard Pro")}'
        
        html_message = render_to_string('emails/welcome.html', {
            'user': user,
            'app_name': getattr(settings, 'APP_NAME', 'RiskGuard Pro'),
            'support_email': getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL)
        })
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Welcome email sent to: {user.email}")
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        raise


def send_password_reset_email(user, uid, token, request):
    """Send password reset email"""
    try:
        # Build reset URL
        reset_url = request.build_absolute_uri(
            reverse('password_reset_confirm') + f'?uid={uid}&token={token}'
        )
        
        subject = 'Password Reset Request'
        
        html_message = render_to_string('emails/password_reset.html', {
            'user': user,
            'reset_url': reset_url,
            'app_name': getattr(settings, 'APP_NAME', 'RiskGuard Pro'),
            'expiry_hours': 1
        })
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Password reset email sent to: {user.email}")
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        raise


def send_password_changed_notification(user):
    """Send notification when password is changed"""
    try:
        subject = 'Password Changed Successfully'
        
        html_message = render_to_string('emails/password_changed.html', {
            'user': user,
            'app_name': getattr(settings, 'APP_NAME', 'RiskGuard Pro'),
            'support_email': getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL)
        })
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Password change notification sent to: {user.email}")
        
    except Exception as e:
        logger.error(f"Failed to send password change notification to {user.email}: {str(e)}")


def send_mfa_enabled_notification(user):
    """Send notification when MFA is enabled"""
    try:
        subject = 'Multi-Factor Authentication Enabled'
        
        html_message = render_to_string('emails/mfa_enabled.html', {
            'user': user,
            'app_name': getattr(settings, 'APP_NAME', 'RiskGuard Pro'),
        })
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"MFA enabled notification sent to: {user.email}")

    except Exception as e:
        logger.error(f"Failed to send MFA enabled notification to {user.email}: {str(e)}")