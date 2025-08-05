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
        
        # Skip for authentication-related views and logout
        exempt_views = [
            'PasswordChangeView', 
            'PasswordChangeRequiredView',
            'LogoutView',
            'LoginView',
            'TokenRefreshView'
        ]
        
        if view_func.__name__ in exempt_views:
            return None
        
        # CRITICAL SECURITY: Block ALL API access for users with temporary passwords
        if (hasattr(request.user, 'is_temp_password') and request.user.is_temp_password) or \
           (hasattr(request.user, 'password_change_required') and request.user.password_change_required):
            
            # For API requests, return 403 Forbidden with clear message
            if request.path.startswith('/api/') and request.path not in ['/api/auth/password-change-required/', '/api/auth/logout/']:
                from django.http import JsonResponse
                return JsonResponse({
                    'detail': 'Password change required. You must change your temporary password before accessing the system.',
                    'code': 'PASSWORD_CHANGE_REQUIRED',
                    'redirect_to': '/change-password'
                }, status=403)
            
            # For regular requests, redirect to password change page
            from django.shortcuts import redirect
            from django.urls import reverse
            return redirect('/change-password')
        
        # Check for expired passwords
        if hasattr(request.user, 'is_password_expired') and request.user.is_password_expired():
            # For API requests, return 403 Forbidden
            if request.path.startswith('/api/') and request.path not in ['/api/auth/password-change-required/', '/api/auth/logout/']:
                from django.http import JsonResponse
                return JsonResponse({
                    'detail': 'Password expired. You must change your password before accessing the system.',
                    'code': 'PASSWORD_EXPIRED',
                    'redirect_to': '/change-password'
                }, status=403)
            
            # For regular requests, redirect to password change page
            from django.shortcuts import redirect
            return redirect('/change-password')
            
        return None