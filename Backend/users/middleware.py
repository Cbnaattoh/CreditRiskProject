"""
Middleware for enforcing MFA completion and token scope validation
"""
from django.http import JsonResponse
from django.urls import reverse, resolve
from .authentication import CustomJWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .tokens import get_token_scope, is_mfa_setup_token
import logging
import json

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