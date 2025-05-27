from django.utils.deprecation import MiddlewareMixin
from .models import BehavioralBiometrics, SuspiciousActivity
from .services import BehavioralAnalyzer
import json
from datetime import datetime
from django.shortcuts import redirect
from django.urls import reverse

class BehavioralMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not request.user.is_authenticated:
            return
        
        # Collect behavioral data
        behavior_data = {
            'ip': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'timestamp': datetime.now().isoformat(),
            'typing': self._get_typing_pattern(request),
            'mouse': self._get_mouse_movements(request)
        }
        
        # Analyze behavior
        analyzer = BehavioralAnalyzer()
        confidence_score = analyzer.analyze_behavior(request.user, behavior_data)
        
        # Store for later use in the request
        request.behavior_confidence = confidence_score
        
        # If confidence is too low, flag for additional authentication
        if confidence_score < 0.3:  # Threshold from settings
            request.requires_verification = True

    def _get_typing_pattern(self, request):
        # Extract typing patterns from request headers or body
        typing_data = request.headers.get('X-Typing-Pattern')
        if typing_data:
            return json.loads(typing_data)
        return {}

    def _get_mouse_movements(self, request):
        # Extract mouse movements from request headers or body
        mouse_data = request.headers.get('X-Mouse-Movements')
        if mouse_data:
            return json.loads(mouse_data)
        return {}


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