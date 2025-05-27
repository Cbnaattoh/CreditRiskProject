from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import LoginHistory
from django.utils import timezone

def get_client_ip(request):
    """
    Get the client's IP address from the request object.
    Handles proxy headers and various HTTP header scenarios.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # X-Forwarded-For can contain a comma-separated list of IPs.
        # The client's IP is typically the first one.
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        # Fall back to REMOTE_ADDR if X-Forwarded-For isn't available
        ip = request.META.get('REMOTE_ADDR')
    
    # Additional safety checks
    if not ip:
        ip = '0.0.0.0'  # Default value if no IP could be determined
    elif ip == '::1':
        ip = '127.0.0.1'  # Convert IPv6 localhost to IPv4
    
    return ip

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    try:
        LoginHistory.objects.create(
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
            session_key=request.session.session_key,
            was_successful=True
        )
    except Exception as e:
        # Log the error but don't break the login flow
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to log user login: {str(e)}")

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    if user.is_authenticated:
        try:
            last_login = LoginHistory.objects.filter(
                user=user,
                session_key=request.session.session_key
            ).last()
            if last_login:
                last_login.logout_time = timezone.now()
                last_login.save()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to log user logout: {str(e)}")