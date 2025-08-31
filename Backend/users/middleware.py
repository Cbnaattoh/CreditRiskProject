"""
Middleware for enforcing MFA completion, token scope validation, and session tracking
"""
from django.http import JsonResponse
from django.urls import reverse, resolve
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.utils import timezone
from .authentication import CustomJWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .tokens import get_token_scope, is_mfa_setup_token
from .models import UserSession, SecurityEvent
import logging
import json
import user_agents

logger = logging.getLogger(__name__)


class MFAEnforcementMiddleware:
    """
    Middleware that enforces MFA completion and validates token scopes.
    
    This middleware:
    1. Checks if users with MFA setup tokens can only access MFA-related endpoints
    2. Ensures users with incomplete MFA cannot access sensitive endpoints
    3. Logs security violations for audit purposes
    """
    
    # Endpoints that MFA setup tokens can access
    MFA_SETUP_ALLOWED_ENDPOINTS = [
        'auth:mfa-setup',
        'auth:mfa-setup-verify', 
        'auth:password-change',
        'token-refresh',
        'api-login',  # For re-authentication
    ]
    
    # URL patterns that MFA setup tokens can access (using regex-like matching)
    MFA_SETUP_ALLOWED_PATTERNS = [
        '/api/auth/mfa/',
        '/api/auth/password-change/',
        '/api/auth/token/refresh/',
        '/api/auth/login/',
        '/api/auth/logout/',  # Allow logout
    ]
    
    # Endpoints that are always accessible regardless of MFA status
    PUBLIC_ENDPOINTS = [
        'auth:api-login',
        'auth:api-register', 
        'auth:password-reset-request',
        'auth:password-reset-confirm',
        'token-refresh',
        'admin:index',  # Django admin
    ]
    
    # URL patterns that are always accessible
    PUBLIC_PATTERNS = [
        '/admin/',
        '/api/auth/login/',
        '/api/auth/register/',
        '/api/auth/password-reset/',
        '/api/auth/token/refresh/',
        '/api/docs/',  # API documentation
        '/static/',
        '/media/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = CustomJWTAuthentication()

    def __call__(self, request):
        # Process the request before view
        response = self.process_request(request)
        if response:
            return response
            
        response = self.get_response(request)
        return response

    def process_request(self, request):
        """Process incoming request and check MFA compliance"""
        
        # Skip middleware for non-API requests or public endpoints
        if not self._should_check_mfa(request):
            return None
            
        # Try to authenticate with JWT
        user, token = self._authenticate_jwt(request)
        if not user:
            return None  # No JWT token or invalid - let normal auth handle it
            
        # Check token scope and enforce restrictions
        return self._enforce_token_scope(request, user, token)

    def _should_check_mfa(self, request):
        """Determine if this request needs MFA checking"""
        path = request.path_info
        
        # Skip for public patterns
        for pattern in self.PUBLIC_PATTERNS:
            if path.startswith(pattern):
                return False
                
        # Skip for non-API requests
        if not path.startswith('/api/'):
            return False
            
        # Skip for OPTIONS requests (CORS)
        if request.method == 'OPTIONS':
            return False
            
        return True

    def _authenticate_jwt(self, request):
        """Try to authenticate the request with JWT"""
        try:
            user_token_tuple = self.jwt_auth.authenticate(request)
            if user_token_tuple:
                user, token = user_token_tuple
                return user, token
        except (InvalidToken, TokenError) as e:
            logger.debug(f"JWT authentication failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in JWT authentication: {e}")
            
        return None, None

    def _enforce_token_scope(self, request, user, token):
        """Enforce token scope restrictions"""
        try:
            # Get the current endpoint name
            resolver_match = resolve(request.path_info)
            endpoint_name = f"{resolver_match.namespace}:{resolver_match.url_name}" if resolver_match.namespace else resolver_match.url_name
            
            # Check if this is an MFA setup token
            if is_mfa_setup_token(token):
                return self._handle_mfa_setup_token(request, user, endpoint_name)
            
            # For full access tokens, check if user has incomplete MFA
            elif hasattr(user, 'requires_mfa_setup') and user.requires_mfa_setup:
                return self._handle_incomplete_mfa(request, user, endpoint_name)
                
        except Exception as e:
            logger.error(f"Error in token scope enforcement: {e}")
            # On error, allow request to proceed but log for investigation
            
        return None

    def _handle_mfa_setup_token(self, request, user, endpoint_name):
        """Handle requests with MFA setup tokens"""
        path = request.path_info
        
        # Check if endpoint is allowed for MFA setup tokens
        if (endpoint_name in self.MFA_SETUP_ALLOWED_ENDPOINTS or 
            any(path.startswith(pattern) for pattern in self.MFA_SETUP_ALLOWED_PATTERNS)):
            return None  # Allow request
            
        # Block access to other endpoints
        logger.warning(
            f"MFA setup token attempted access to restricted endpoint: {endpoint_name}",
            extra={
                'user_id': user.id,
                'email': user.email,
                'endpoint': endpoint_name,
                'path': path,
                'ip': self._get_client_ip(request)
            }
        )
        
        return JsonResponse({
            'error': 'Access denied',
            'message': 'Your access is limited. Please complete MFA setup to access this resource.',
            'requires_mfa_setup': True,
            'allowed_endpoints': self.MFA_SETUP_ALLOWED_PATTERNS
        }, status=403)

    def _handle_incomplete_mfa(self, request, user, endpoint_name):
        """Handle requests from users with incomplete MFA"""
        path = request.path_info
        
        # If user has incomplete MFA, they should only access MFA setup endpoints
        if not (endpoint_name in self.MFA_SETUP_ALLOWED_ENDPOINTS or 
                any(path.startswith(pattern) for pattern in self.MFA_SETUP_ALLOWED_PATTERNS)):
            
            logger.warning(
                f"User with incomplete MFA attempted access: {endpoint_name}",
                extra={
                    'user_id': user.id,
                    'email': user.email,
                    'endpoint': endpoint_name,
                    'mfa_enabled': getattr(user, 'mfa_enabled', False),
                    'mfa_completed': getattr(user, 'is_mfa_fully_configured', False),
                    'ip': self._get_client_ip(request)
                }
            )
            
            return JsonResponse({
                'error': 'MFA setup required',
                'message': 'You must complete MFA setup before accessing this resource.',
                'requires_mfa_setup': True,
                'setup_url': '/api/auth/mfa/setup/'
            }, status=403)
            
        return None

    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MFAScopeValidationMiddleware:
    """
    Lighter middleware that only validates token scopes without blocking requests.
    Use this if you want to log violations but not enforce restrictions.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = CustomJWTAuthentication()

    def __call__(self, request):
        # Add token scope information to request for views to use
        self._add_token_scope_info(request)
        
        response = self.get_response(request)
        return response

    def _add_token_scope_info(self, request):
        """Add token scope information to request object"""
        try:
            user_token_tuple = self.jwt_auth.authenticate(request)
            if user_token_tuple:
                user, token = user_token_tuple
                request.token_scope = get_token_scope(token)
                request.is_mfa_setup_token = is_mfa_setup_token(token)
                request.jwt_user = user
            else:
                request.token_scope = None
                request.is_mfa_setup_token = False
                request.jwt_user = None
                
        except Exception as e:
            logger.debug(f"Could not extract token scope: {e}")
            request.token_scope = None
            request.is_mfa_setup_token = False
            request.jwt_user = None


class SessionTrackingMiddleware:
    """
    Middleware to track user sessions for security monitoring
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # First check if the session should be terminated before processing
        if hasattr(request, 'user') and request.user.is_authenticated:
            # DEBUG: Print middleware execution
            print(f"🔍 SessionTrackingMiddleware: Checking user {request.user.email} on {request.path}")
            
            # Check both session-based and JWT-based authentication
            session_terminated = False
            
            # Check if user is marked for forced logout
            from django.core.cache import cache
            force_logout_flag = cache.get(f"force_logout_{request.user.id}")
            if force_logout_flag:
                session_terminated = True
                print(f"🚫 Force logout flag detected for user {request.user.email}")
                logger.info(f"Force logout flag detected for user {request.user.email}")
                # Clear the flag after using it
                cache.delete(f"force_logout_{request.user.id}")
            else:
                print(f"✅ No force logout flag for user {request.user.email}")
            
            # Check Django session
            session_key = request.session.session_key
            if session_key:
                try:
                    user_session = UserSession.objects.get(
                        session_key=session_key,
                        user=request.user
                    )
                    
                    # If session has been terminated, force logout
                    if not user_session.is_active:
                        session_terminated = True
                        logger.info(f"Django session terminated for user {request.user.email}")
                    else:
                        # Update last activity for active sessions
                        user_session.last_activity = timezone.now()
                        user_session.save(update_fields=['last_activity'])
                        
                except UserSession.DoesNotExist:
                    # Session exists but not tracked - create it
                    self._create_user_session(request)
            
            # For JWT authentication, check if user has any active sessions
            # If all sessions are terminated, the user should be logged out
            if not session_terminated and self._is_jwt_request(request):
                active_sessions = UserSession.objects.filter(
                    user=request.user,
                    is_active=True
                ).exists()
                
                if not active_sessions:
                    session_terminated = True
                    logger.info(f"All sessions terminated for JWT user {request.user.email}")
            
            # Handle session termination
            if session_terminated:
                # Flush the Django session to force logout
                request.session.flush()
                
                # Return 401 Unauthorized for API calls
                if request.path.startswith('/api/'):
                    return JsonResponse({
                        'error': 'Session terminated',
                        'message': 'Your session has been terminated. Please log in again.',
                        'code': 'SESSION_TERMINATED'
                    }, status=401)
                else:
                    # For non-API requests, redirect to login
                    from django.shortcuts import redirect
                    return redirect('/api/auth/login/')
        
        response = self.get_response(request)
        return response

    def _is_jwt_request(self, request):
        """Check if request is authenticated via JWT"""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        return auth_header.startswith('Bearer ')

    def _create_user_session(self, request):
        """Create a UserSession record for tracking"""
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return
        
        session_key = request.session.session_key
        if not session_key:
            return
        
        # Parse user agent
        user_agent_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = user_agents.parse(user_agent_string)
        
        # Get IP address
        ip_address = self._get_client_ip(request)
        
        # Determine device type
        device_type = 'mobile' if user_agent.is_mobile else 'tablet' if user_agent.is_tablet else 'desktop'
        
        # Get location (simplified - in production you'd use GeoIP)
        location = self._get_location(ip_address)
        
        try:
            user_session, created = UserSession.objects.get_or_create(
                session_key=session_key,
                user=request.user,
                defaults={
                    'ip_address': ip_address,
                    'user_agent': user_agent_string[:500],
                    'device_type': device_type,
                    'browser': f"{user_agent.browser.family} {user_agent.browser.version_string}",
                    'os': f"{user_agent.os.family} {user_agent.os.version_string}",
                    'location': location,
                    'is_active': True,
                }
            )
            
            if created:
                logger.info(f"Created session tracking for user {request.user.email}")
                
                # Create security event for new session
                SecurityEvent.objects.create(
                    user=request.user,
                    event_type='login',
                    severity='low',
                    description=f'New session created from {device_type}',
                    ip_address=ip_address,
                    user_agent=user_agent_string[:500],
                    metadata={
                        'device_type': device_type,
                        'browser': f"{user_agent.browser.family} {user_agent.browser.version_string}",
                        'os': f"{user_agent.os.family} {user_agent.os.version_string}",
                        'location': location
                    }
                )
        
        except Exception as e:
            logger.error(f"Failed to create session tracking: {e}")

    def _get_client_ip(self, request):
        """Get the client's IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def _get_location(self, ip_address):
        """Get location from IP address (simplified version)"""
        # In production, you'd use a service like GeoIP2, MaxMind, or ipapi
        if ip_address == '127.0.0.1' or ip_address.startswith('192.168.'):
            return 'Local/Private Network'
        return 'Unknown Location'  # Placeholder


@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    """Handle user login signal"""
    session_key = request.session.session_key
    if session_key:
        # Parse user agent
        user_agent_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = user_agents.parse(user_agent_string)
        
        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
        
        # Determine device type
        device_type = 'mobile' if user_agent.is_mobile else 'tablet' if user_agent.is_tablet else 'desktop'
        
        # Get location (simplified)
        location = 'Local/Private Network' if ip_address == '127.0.0.1' or ip_address.startswith('192.168.') else 'Unknown Location'
        
        try:
            # Create or update session
            user_session, created = UserSession.objects.get_or_create(
                session_key=session_key,
                user=user,
                defaults={
                    'ip_address': ip_address,
                    'user_agent': user_agent_string[:500],
                    'device_type': device_type,
                    'browser': f"{user_agent.browser.family} {user_agent.browser.version_string}",
                    'os': f"{user_agent.os.family} {user_agent.os.version_string}",
                    'location': location,
                    'is_active': True,
                }
            )
            
            if not created:
                # Reactivate existing session
                user_session.is_active = True
                user_session.last_activity = timezone.now()
                user_session.save(update_fields=['is_active', 'last_activity'])
            
            logger.info(f"User {user.email} logged in - Session tracking {'created' if created else 'reactivated'}")
            
            # Create security event
            SecurityEvent.objects.create(
                user=user,
                event_type='login',
                severity='low',
                description=f'User logged in from {device_type}',
                ip_address=ip_address,
                user_agent=user_agent_string[:500],
                metadata={
                    'device_type': device_type,
                    'browser': f"{user_agent.browser.family} {user_agent.browser.version_string}",
                    'os': f"{user_agent.os.family} {user_agent.os.version_string}",
                    'location': location,
                    'session_created': created
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to track login session for {user.email}: {e}")


@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    """Handle user logout signal"""
    if user and hasattr(request, 'session'):
        session_key = getattr(request.session, 'session_key', None)
        if session_key:
            try:
                user_session = UserSession.objects.get(
                    session_key=session_key,
                    user=user,
                    is_active=True
                )
                user_session.terminate(by_user=True)
                logger.info(f"User {user.email} logged out - Session terminated")
                
                # Create security event
                SecurityEvent.objects.create(
                    user=user,
                    event_type='logout',
                    severity='low',
                    description='User logged out',
                    ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1'),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    metadata={'session_terminated': True}
                )
                
            except UserSession.DoesNotExist:
                pass
            except Exception as e:
                logger.error(f"Failed to terminate session for {user.email}: {e}")