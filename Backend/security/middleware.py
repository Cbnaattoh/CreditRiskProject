import json
import time
import logging
from django.utils.timezone import now
from django.contrib.auth import get_user
from django.utils.deprecation import MiddlewareMixin
from .models import SuspiciousActivity, BehavioralBiometrics
from .utils.behavioral_analyzer import BehavioralAnalyzer
from .utils.anomaly_detector import AnomalyDetector
import threading
from django.shortcuts import redirect
from django.urls import reverse
from django.core.exceptions import MiddlewareNotUsed, ImproperlyConfigured
from django.conf import settings

logger = logging.getLogger(__name__)

class SecurityMonitoringMiddleware(MiddlewareMixin):
    """
    Enhanced security monitoring middleware that captures and analyzes user behavior.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Initialize analyzers with error handling
        try:
            self.analyzer = BehavioralAnalyzer()
            self.anomaly_detector = AnomalyDetector()
            logger.info("Security monitoring middleware initialized successfully")
        except Exception as e:
            logger.warning(f"Security monitoring initialization failed: {e}")
            # Don't disable middleware completely, just use basic monitoring
            self.analyzer = None
            self.anomaly_detector = None
        
        super().__init__(get_response)

class BehavioralMiddleware(MiddlewareMixin):
    """Legacy behavioral middleware - enhanced with new capabilities."""
    
    def __init__(self, get_response):
        super().__init__(get_response)
        
        # Enable by default for development
        behavioral_enabled = getattr(settings, 'BEHAVIORAL_ANALYSIS_ENABLED', True)
        
        if not behavioral_enabled:
            logger.info("Behavioral analysis is disabled in settings")
            self.analyzer = None
            self.anomaly_detector = None
        else:
            try:
                self.analyzer = BehavioralAnalyzer()
                self.anomaly_detector = AnomalyDetector()
                logger.info("Behavioral middleware initialized successfully")
            except Exception as e:
                logger.warning(f"Behavioral analysis initialization failed: {e}")
                self.analyzer = None
                self.anomaly_detector = None

    def process_request(self, request):
        """Enhanced request processing with comprehensive behavioral analysis."""
        if not request.user.is_authenticated:
            return
        
        # Capture request start time for performance analysis
        request._security_start_time = time.time()
        
        # Extract behavioral data from request headers (sent by frontend)
        behavior_data = {
            'ip_address': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'timestamp': now().isoformat(),
            'path': request.path,
            'method': request.method,
            'typing': self._get_typing_pattern(request),
            'mouse': self._get_mouse_movements(request),
            'session': self._get_session_data(request)
        }
        
        # Perform behavioral analysis if analyzer is available
        if self.analyzer:
            try:
                confidence_score = self.analyzer.analyze_behavioral_pattern(request.user, behavior_data)
                request.behavior_confidence = confidence_score
                
                # Set verification requirement based on confidence
                threshold = getattr(settings, 'BEHAVIORAL_CONFIDENCE_THRESHOLD', 0.3)
                if confidence_score < threshold:
                    request.requires_verification = True
                    logger.warning(f"Low behavioral confidence for user {request.user.id}: {confidence_score:.3f}")
                
            except Exception as e:
                logger.error(f"Error in behavioral analysis: {e}")
                request.behavior_confidence = 0.5  # Neutral score on error
        else:
            # Fallback behavior for when analyzer is not available
            request.behavior_confidence = 0.7  # Conservative score
        
        return None

    def _get_typing_pattern(self, request):
        """Extract typing pattern data from request headers."""
        typing_data = request.headers.get('X-Typing-Data') or request.headers.get('X-Typing-Pattern')
        try:
            return json.loads(typing_data) if typing_data else {}
        except json.JSONDecodeError:
            return {}

    def _get_mouse_movements(self, request):
        """Extract mouse movement data from request headers."""
        mouse_data = request.headers.get('X-Mouse-Data') or request.headers.get('X-Mouse-Movements')
        try:
            return json.loads(mouse_data) if mouse_data else {}
        except json.JSONDecodeError:
            return {}
    
    def _get_session_data(self, request):
        """Extract session data from request headers."""
        session_data = request.headers.get('X-Session-Data')
        try:
            return json.loads(session_data) if session_data else {}
        except json.JSONDecodeError:
            return {}
    
    def _get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '127.0.0.1')

    def process_response(self, request, response):
        """Enhanced response processing with anomaly detection."""
        # Skip if not authenticated
        user = get_user(request)
        if not user.is_authenticated:
            return response

        # Calculate request processing time
        if hasattr(request, '_security_start_time'):
            processing_time = time.time() - request._security_start_time
        else:
            processing_time = 0

        # Analyze the request-response cycle for anomalies
        if self.anomaly_detector:
            try:
                self._analyze_request_response_async(request, response, user, processing_time)
            except Exception as e:
                logger.error(f"Error in response analysis: {e}")
        
        return response

    def _analyze_request_response_async(self, request, response, user, processing_time):
        """Analyze request-response patterns in a background thread."""
        def analyze():
            try:
                # Determine activity type based on request path and method
                activity_type = self._determine_activity_type(request.path, request.method)
                
                if not activity_type:
                    return  # Skip non-monitorable activities

                # Gather analysis data
                analysis_data = {
                    'user': user,
                    'activity_type': activity_type,
                    'ip_address': self._get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'path': request.path,
                    'method': request.method,
                    'status_code': response.status_code,
                    'processing_time': processing_time,
                    'timestamp': now()
                }

                # Check for suspicious patterns
                is_suspicious, confidence, details = self.anomaly_detector.analyze_activity(
                    user, analysis_data
                )

                if is_suspicious and confidence > 0.5:
                    # Create suspicious activity record
                    SuspiciousActivity.objects.create(
                        user=user,
                        activity_type=activity_type,
                        detected_at=analysis_data['timestamp'],
                        ip_address=analysis_data['ip_address'],
                        user_agent=analysis_data['user_agent'],
                        confidence=confidence,
                        details=details,
                        was_challenged=False,
                        was_successful=response.status_code < 400,
                        risk_level=self._determine_risk_level(confidence)
                    )
                    
                    logger.warning(
                        f"Suspicious activity detected: {activity_type} by user {user.email} "
                        f"with confidence {confidence:.3f}"
                    )

            except Exception as e:
                logger.error(f"Error in async request-response analysis: {e}")

        # Run analysis in background thread
        threading.Thread(target=analyze, daemon=True).start()

    def _determine_activity_type(self, path, method):
        """Determine the type of activity based on request path and method."""
        activity_mapping = {
            '/api/auth/login/': 'LOGIN',
            '/api/auth/logout/': 'LOGIN',
            '/api/auth/password/change/': 'PASSWORD',
            '/api/auth/password/reset/': 'PASSWORD',
            '/api/applications/': 'APPLICATION',
            '/api/users/me/': 'PROFILE',
            '/api/users/settings/': 'SETTINGS',
        }
        
        # Check for exact matches first
        for pattern, activity_type in activity_mapping.items():
            if path.startswith(pattern):
                return activity_type
        
        # Check for application-related activities
        if '/api/applications/' in path:
            return 'APPLICATION'
        
        # Check for user-related activities
        if '/api/users/' in path:
            return 'PROFILE'
        
        # For other sensitive endpoints with write operations
        if method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return 'OTHER'
        
        return None

    def _determine_risk_level(self, confidence):
        """Determine risk level based on confidence score."""
        if confidence >= 0.8:
            return 'HIGH'
        elif confidence >= 0.5:
            return 'MEDIUM'
        elif confidence >= 0.3:
            return 'LOW'
        return 'LOW'


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