from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from .models import PermissionLog
import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
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
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255] if request else ''
        )
    except Exception as e:
        logger.error(f"Failed to log permission check: {e}")


class BaseRBACPermission(permissions.BasePermission):
    """Base permission class with RBAC logging"""
    
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


class HasPermission(BaseRBACPermission):
    """DRF Permission class to check if user has specific permission"""
    
    def __init__(self, permission_codename):
        self.permission_codename = permission_codename
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        has_perm = request.user.has_permission(self.permission_codename)
        self.log_access(request, self.permission_codename, has_perm, view)
        
        return has_perm


class HasRole(BaseRBACPermission):
    """DRF Permission class to check if user has specific role"""
    
    def __init__(self, role_name):
        self.role_name = role_name
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        has_role = request.user.has_role(self.role_name)
        self.log_access(request, f"role:{self.role_name}", has_role, view)
        
        return has_role


class HasAnyRole(BaseRBACPermission):
    """DRF Permission class to check if user has any of the specified roles"""
    
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


class HasAnyPermission(BaseRBACPermission):
    """DRF Permission class to check if user has any of the specified permissions"""
    
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


class IsOwnerOrHasPermission(BaseRBACPermission):
    """DRF Permission class to check if user owns resource or has permission"""
    
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





def RequirePermission(permission_codename):
    """
    Factory function that returns a permission class.
    Use this in permission_classes list.
    """
    class PermissionClass(HasPermission):
        def __init__(self):
            super().__init__(permission_codename)
    
    return PermissionClass


def RequireOwnerOrPermission(permission_codename, owner_field='user'):
    """
    Factory function that returns an owner-or-permission class.
    Use this in permission_classes list.
    """
    class OwnerOrPermissionClass(IsOwnerOrHasPermission):
        def __init__(self):
            super().__init__(permission_codename, owner_field)
    
    return OwnerOrPermissionClass


def RequireRole(role_name):
    """
    Factory function that returns a role permission class.
    Use this in permission_classes list.
    """
    class RolePermissionClass(HasRole):
        def __init__(self):
            super().__init__(role_name)
    
    return RolePermissionClass


def RequireAnyRole(role_names):
    """
    Factory function that returns an any-role permission class.
    Use this in permission_classes list.
    """
    class AnyRolePermissionClass(HasAnyRole):
        def __init__(self):
            super().__init__(role_names)
    
    return AnyRolePermissionClass





class RBACMixin:
    """
    Mixin to easily add RBAC permissions to views.
    """
    required_permission = None
    required_role = None
    required_any_roles = None
    
    def get_permissions(self):
        """Get permissions with RBAC check"""
        permissions_list = [permissions.IsAuthenticated()]
        
        if self.required_permission:
            permissions_list.append(RequirePermission(self.required_permission)())
        
        if self.required_role:
            permissions_list.append(RequireRole(self.required_role)())
            
        if self.required_any_roles:
            permissions_list.append(RequireAnyRole(self.required_any_roles)())
        
        return permissions_list




def require_permission(permission_codename):
    """Decorator to require specific permission for function views"""
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
    """Decorator to require specific role for function views"""
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
    """Decorator to require any of the specified roles for function views"""
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


# Quick check function for views
def check_permission(user, permission_codename):
    """Quick permission check function"""
    return user.is_authenticated and user.has_permission(permission_codename)


def check_role(user, role_name):
    """Quick role check function"""
    return user.is_authenticated and user.has_role(role_name)


# Role-based shortcuts
def admin_required(view_func):
    """Decorator requiring Administrator role"""
    return require_role('Administrator')(view_func)


def staff_required(view_func):
    """Decorator requiring any staff role"""
    return require_any_role(['Administrator', 'Risk Analyst', 'Compliance Auditor', 'Manager'])(view_func)


def analyst_required(view_func):
    """Decorator requiring Risk Analyst role"""
    return require_role('Risk Analyst')(view_func)


def auditor_required(view_func):
    """Decorator requiring Compliance Auditor role"""
    return require_role('Compliance Auditor')(view_func)


# Pre-defined permission classes for common use cases
class IsAdminUser(RequireRole('Administrator')):
    """Permission class for admin users"""
    pass


class IsStaffUser(RequireAnyRole(['Administrator', 'Risk Analyst', 'Compliance Auditor', 'Manager'])):
    """Permission class for staff users"""
    pass


class CanViewUsers(RequirePermission('user_view_all')):
    """Permission class for viewing users"""
    pass


class CanEditUsers(RequirePermission('user_edit_all')):
    """Permission class for editing users"""
    pass


class CanManageRoles(RequirePermission('user_manage_roles')):
    """Permission class for managing roles"""
    pass


class CanViewAuditLogs(RequirePermission('view_audit_logs')):
    """Permission class for viewing audit logs"""
    pass


class CanViewDashboard(RequirePermission('view_dashboard')):
    """Permission class for viewing dashboard"""
    pass