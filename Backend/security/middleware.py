from django.utils.deprecation import MiddlewareMixin
from .models import BehavioralBiometrics, SuspiciousActivity
from .services import BehavioralAnalyzer
import json
from datetime import datetime
from django.shortcuts import redirect
from django.urls import reverse
from django.core.exceptions import MiddlewareNotUsed, ImproperlyConfigured
from django.conf import settings

class BehavioralMiddleware(MiddlewareMixin):
    def __init__(self, get_response):
        super().__init__(get_response)
        
        if not getattr(settings, 'BEHAVIORAL_ANALYSIS_ENABLED', False):
            raise MiddlewareNotUsed("Behavioral analysis is disabled in settings")
            
        try:
            self.analyzer = BehavioralAnalyzer()
        except ImproperlyConfigured as e:
            raise MiddlewareNotUsed(str(e))

    def process_request(self, request):
        if not request.user.is_authenticated:
            return
            
        behavior_data = {
            'ip': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'timestamp': datetime.now().isoformat(),
            'typing': self._get_typing_pattern(request),
            'mouse': self._get_mouse_movements(request)
        }
        
        confidence_score = self.analyzer.analyze_behavior(request.user, behavior_data)
        request.behavior_confidence = confidence_score
        
        if confidence_score < 0.3:  # Threshold from settings
            request.requires_verification = True

    def _get_typing_pattern(self, request):
        typing_data = request.headers.get('X-Typing-Pattern')
        return json.loads(typing_data) if typing_data else {}

    def _get_mouse_movements(self, request):
        mouse_data = request.headers.get('X-Mouse-Movements')
        return json.loads(mouse_data) if mouse_data else {}


class PasswordExpirationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        if not request.user.is_authenticated:
            return None
            
        # Skip for password change views and logout
        if view_func.__name__ in ['PasswordChangeView', 'LogoutView']:
            return None
            
        if request.user.check_password_expiration():
            from django.urls import reverse
            return redirect(reverse('password_change_required'))
            
        return None