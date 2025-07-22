from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from .models import PermissionLog
import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_permission_check(user, permission, action, request=None, resource_type=None, resource_id=None):
    """Log permission check for audit purposes"""
    try:
        PermissionLog.objects.create(
            user=user,
            permission_codename=permission,
            resource_type=resource_type or '',
            resource_id=str(resource_id) if resource_id else '',
            action=action,
            ip_address=get_client_ip(request) if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else ''
        )
    except Exception as e:
        logger.error(f"Failed to log permission check: {e}")


class BasePermission(permissions.BasePermission):
    """Base permission class with logging"""
    
    def log_access(self, request, permission_code, granted, view=None):
        """Log permission check"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            action = 'granted' if granted else 'denied'
            resource_type = getattr(view, 'model', None)
            resource_type = resource_type.__name__ if resource_type else view.__class__.__name__
            
            log_permission_check(
                user=request.user,
                permission=permission_code,
                action=action,
                request=request,
                resource_type=resource_type
            )


class HasPermission(BasePermission):
    """Check if user has specific permission"""
    
    def __init__(self, permission_codename):
        self.permission_codename = permission_codename
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        has_perm = request.user.has_permission(self.permission_codename)
        self.log_access(request, self.permission_codename, has_perm, view)
        
        return has_perm


class HasRole(BasePermission):
    """Check if user has specific role"""
    
    def __init__(self, role_name):
        self.role_name = role_name
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        has_role = request.user.has_role(self.role_name)
        self.log_access(request, f"role:{self.role_name}", has_role, view)
        
        return has_role


class HasAnyRole(BasePermission):
    """Check if user has any of the specified roles"""
    
    def __init__(self, role_names):
        self.role_names = role_names if isinstance(role_names, list) else [role_names]
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        for role_name in self.role_names:
            if request.user.has_role(role_name):
                self.log_access(request, f"any_role:{','.join(self.role_names)}", True, view)
                return True
        
        self.log_access(request, f"any_role:{','.join(self.role_names)}", False, view)
        return False


class HasAnyPermission(BasePermission):
    """Check if user has any of the specified permissions"""
    
    def __init__(self, permission_codenames):
        self.permission_codenames = permission_codenames if isinstance(permission_codenames, list) else [permission_codenames]
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        for permission in self.permission_codenames:
            if request.user.has_permission(permission):
                self.log_access(request, f"any_perm:{','.join(self.permission_codenames)}", True, view)
                return True
        
        self.log_access(request, f"any_perm:{','.join(self.permission_codenames)}", False, view)
        return False


class IsOwnerOrHasPermission(BasePermission):
    """Check if user owns resource or has permission"""
    
    def __init__(self, permission_codename, owner_field='user'):
        self.permission_codename = permission_codename
        self.owner_field = owner_field
    
    def has_object_permission(self, request, view, obj):
        # Check ownership first
        owner = getattr(obj, self.owner_field, None)
        if owner == request.user:
            self.log_access(request, f"owner:{self.permission_codename}", True, view)
            return True
        
        # Check permission
        has_perm = request.user.has_permission(self.permission_codename)
        self.log_access(request, self.permission_codename, has_perm, view)
        
        return has_perm


# Function decorators for view functions
def require_permission(permission_codename):
    """Decorator to require specific permission"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            if not request.user.has_permission(permission_codename):
                log_permission_check(
                    user=request.user,
                    permission=permission_codename,
                    action='denied',
                    request=request
                )
                return JsonResponse({'error': 'Permission denied'}, status=403)
            
            log_permission_check(
                user=request.user,
                permission=permission_codename,
                action='granted',
                request=request
            )
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_role(role_name):
    """Decorator to require specific role"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            if not request.user.has_role(role_name):
                log_permission_check(
                    user=request.user,
                    permission=f"role:{role_name}",
                    action='denied',
                    request=request
                )
                return JsonResponse({'error': 'Role required'}, status=403)
            
            log_permission_check(
                user=request.user,
                permission=f"role:{role_name}",
                action='granted',
                request=request
            )
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_any_role(role_names):
    """Decorator to require any of the specified roles"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            for role_name in role_names:
                if request.user.has_role(role_name):
                    log_permission_check(
                        user=request.user,
                        permission=f"any_role:{','.join(role_names)}",
                        action='granted',
                        request=request
                    )
                    return func(request, *args, **kwargs)
            
            log_permission_check(
                user=request.user,
                permission=f"any_role:{','.join(role_names)}",
                action='denied',
                request=request
            )
            return JsonResponse({'error': 'Insufficient role'}, status=403)
        return wrapper
    return decorator


class PermissionMixin:
    """Mixin for class-based views to add permission checking"""
    required_permissions = []
    required_roles = []
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Check permissions
        for permission in self.required_permissions:
            if not request.user.has_permission(permission):
                log_permission_check(
                    user=request.user,
                    permission=permission,
                    action='denied',
                    request=request,
                    resource_type=self.__class__.__name__
                )
                return JsonResponse({'error': f'Permission {permission} required'}, status=403)
        
        # Check roles
        for role in self.required_roles:
            if not request.user.has_role(role):
                log_permission_check(
                    user=request.user,
                    permission=f"role:{role}",
                    action='denied',
                    request=request,
                    resource_type=self.__class__.__name__
                )
                return JsonResponse({'error': f'Role {role} required'}, status=403)
        
        return super().dispatch(request, *args, **kwargs)