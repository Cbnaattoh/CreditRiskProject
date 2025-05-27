from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import LoginHistory
from datetime import timezone

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    LoginHistory.objects.create(
        user=user,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        session_key=request.session.session_key,
        was_successful=True
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    if user.is_authenticated:
        last_login = LoginHistory.objects.filter(
            user=user,
            session_key=request.session.session_key
        ).last()
        if last_login:
            last_login.logout_time = timezone.now()
            last_login.save()

def get_client_ip(request):
    pass