from rest_framework import generics, permissions, status, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ValidationError
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import LoginHistory, UserProfile
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.throttling import AnonRateThrottle,UserRateThrottle
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Prefetch
from django.core.cache import cache
from .models import Permission, Role, UserRole, PermissionLog
from .permissions import (
    HasPermission, HasRole, HasAnyRole, require_permission, require_role, admin_required, staff_required
)
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    LoginHistorySerializer,
    MFASetupSerializer,
    MFAVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserRegisterSerializer,
    AdminUserCreateSerializer,
    PasswordChangeSerializer,
    UserUpdateSerializer,
    MFASetupVerifySerializer,
    PermissionSerializer,
    RoleSerializer,
    UserRoleSerializer,
    UserWithRolesSerializer,
    RoleAssignmentSerializer,
    PermissionLogSerializer,
    UserPermissionCheckSerializer,
    RolePermissionUpdateSerializer,
    UserRoleHistorySerializer,
    DetailedRoleSerializer,
    UserRoleSummarySerializer
)
from api.docs.views.password import (
    password_reset_confirm_docs,
    password_change_required_get_docs,
    password_change_required_post_docs,
    password_reset_request_docs
)
from api.docs.views.auth import login_docs, register_docs, login_history_docs
from api.docs.views.users import get_user_profile_docs, update_user_profile_docs, partial_update_user_profile_docs
from api.docs.views.mfa import mfa_setup_docs, mfa_verify_docs
from users.utils.mfa import generate_backup_codes, verify_backup_code
from .utils.email import send_password_reset_email, send_welcome_email
import pyotp
import logging
import json
from datetime import timedelta, datetime

logger = logging.getLogger(__name__)
User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    """Rate limiting for login attempts"""
    rate = '10/min'

class StrictLoginThrottle(AnonRateThrottle):
    """Strict rate limiting for repeated failures"""
    rate = '3/min'



class PermissionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing permissions"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    filterset_fields = ['content_type', 'codename']
    search_fields = ['name', 'codename', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        """Apply RBAC permissions based on action"""
        permission_classes = [IsAuthenticated]
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes.append(HasPermission('system_settings'))
        else:
            permission_classes.append(HasPermission('role_view'))
        
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def by_content_type(self, request):
        """Get permissions grouped by content type"""
        permissions = self.get_queryset().select_related('content_type')
        grouped = {}
        
        for perm in permissions:
            ct_name = perm.content_type.name if perm.content_type else 'General'
            if ct_name not in grouped:
                grouped[ct_name] = []
            grouped[ct_name].append(PermissionSerializer(perm).data)
        
        return Response(grouped)
    

class RoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing roles"""
    queryset = Role.objects.prefetch_related('permissions').annotate(
        user_count=Count('userrole', filter=Q(userrole__is_active=True))
    )
    serializer_class = RoleSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'user_count']
    ordering = ['name']

    def get_permissions(self):
        """Apply RBAC permissions based on action"""
        permission_classes = [IsAuthenticated]
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes.append(HasPermission('role_edit'))
        else:
            permission_classes.append(HasPermission('role_view'))
        
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Return detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return DetailedRoleSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['post'])
    def update_permissions(self, request, pk=None):
        """Update role permissions (add, remove, or set)"""
        role = self.get_object()
        serializer = RolePermissionUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            permission_ids = serializer.validated_data['permission_ids']
            action_type = serializer.validated_data['action']
            
            permissions = Permission.objects.filter(id__in=permission_ids)
            
            with transaction.atomic():
                if action_type == 'add':
                    role.permissions.add(*permissions)
                elif action_type == 'remove':
                    role.permissions.remove(*permissions)
                elif action_type == 'set':
                    role.permissions.set(permissions)
                
                role.updated_at = timezone.now()
                role.save()
            
            return Response({
                'message': f'Permissions {action_type}ed successfully',
                'role': DetailedRoleSerializer(role).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """Get users assigned to this role"""
        role = self.get_object()
        user_roles = UserRole.objects.filter(
            role=role,
            is_active=True
        ).select_related('user', 'assigned_by')
        
        # Filter by expiration status if requested
        expired_filter = request.query_params.get('expired')
        if expired_filter == 'true':
            user_roles = user_roles.filter(expires_at__lte=timezone.now())
        elif expired_filter == 'false':
            user_roles = user_roles.filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
            )
        
        serializer = UserRoleSerializer(user_roles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get role statistics summary"""
        roles = Role.objects.all()
        serializer = UserRoleSummarySerializer(roles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """Clone a role with all its permissions"""
        source_role = self.get_object()
        new_name = request.data.get('name')
        
        if not new_name:
            return Response(
                {'error': 'Name is required for cloning'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Role.objects.filter(name=new_name).exists():
            return Response(
                {'error': 'Role with this name already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            new_role = Role.objects.create(
                name=new_name,
                description=f"Cloned from {source_role.name}",
                is_active=True
            )
            new_role.permissions.set(source_role.permissions.all())
        
        serializer = RoleSerializer(new_role)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    

class UserRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user-role assignments"""
    queryset = UserRole.objects.select_related('user', 'role', 'assigned_by')
    serializer_class = UserRoleSerializer
    filterset_fields = ['is_active', 'role', 'user']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'role__name']
    ordering_fields = ['assigned_at', 'expires_at']
    ordering = ['-assigned_at']

    def get_permissions(self):
        """Apply RBAC permissions based on action"""
        permission_classes = [IsAuthenticated]
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes.append(HasPermission('user_manage_roles'))
        else:
            permission_classes.append(HasPermission('role_view'))
        
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Set assigned_by when creating user role"""
        serializer.save(assigned_by=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """Bulk assign role to multiple users"""
        serializer = RoleAssignmentSerializer(data=request.data)
        
        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            role_id = serializer.validated_data['role_id']
            expires_at = serializer.validated_data.get('expires_at')
            
            users = User.objects.filter(id__in=user_ids)
            role = Role.objects.get(id=role_id)
            
            assignments_created = []
            assignments_updated = []
            errors = []
            
            with transaction.atomic():
                for user in users:
                    try:
                        user_role = user.assign_role(
                            role=role,
                            assigned_by=request.user,
                            expires_at=expires_at
                        )
                        
                        if user_role:
                            assignments_created.append({
                                'user_id': user.id,
                                'user_email': user.email,
                                'role_name': role.name
                            })
                    except Exception as e:
                        errors.append({
                            'user_id': user.id,
                            'error': str(e)
                        })
            
            return Response({
                'assignments_created': assignments_created,
                'assignments_updated': assignments_updated,
                'errors': errors,
                'total_processed': len(users)
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk_remove(self, request):
        """Bulk remove role from multiple users"""
        user_ids = request.data.get('user_ids', [])
        role_id = request.data.get('role_id')
        
        if not user_ids or not role_id:
            return Response(
                {'error': 'user_ids and role_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(id__in=user_ids)
        role = get_object_or_404(Role, id=role_id)
        
        removed_count = 0
        for user in users:
            user.remove_role(role)
            removed_count += 1
        
        return Response({
            'message': f'Role removed from {removed_count} users',
            'role_name': role.name,
            'users_processed': removed_count
        })

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get role assignments expiring within specified days"""
        days = int(request.query_params.get('days', 7))
        cutoff_date = timezone.now() + timedelta(days=days)
        
        expiring_assignments = self.get_queryset().filter(
            is_active=True,
            expires_at__lte=cutoff_date,
            expires_at__gt=timezone.now()
        )
        
        serializer = self.get_serializer(expiring_assignments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get expired role assignments"""
        expired_assignments = self.get_queryset().filter(
            is_active=True,
            expires_at__lte=timezone.now()
        )
        
        serializer = self.get_serializer(expired_assignments, many=True)
        return Response(serializer.data)


class UserManagementViewSet(viewsets.ModelViewSet):
    """User management with RBAC functionality"""
    queryset = User.objects.prefetch_related(
        Prefetch('user_roles', queryset=UserRole.objects.filter(is_active=True))
    )
    serializer_class = UserWithRolesSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['email', 'date_joined']
    ordering = ['email']

    def get_permissions(self):
        """Apply RBAC permissions based on action"""
        permission_classes = [IsAuthenticated]
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes.append(HasPermission('user_edit_all'))
        else:
            permission_classes.append(HasPermission('user_view_all'))
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Use AdminUserCreateSerializer for user creation"""
        if self.action == 'create':
            return AdminUserCreateSerializer
        return super().get_serializer_class()
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """Assign role to specific user"""
        user = self.get_object()
        role_id = request.data.get('role_id')
        expires_at = request.data.get('expires_at')
        
        if not role_id:
            return Response(
                {'error': 'role_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        role = get_object_or_404(Role, id=role_id)
        
        # Check if requesting user can assign this role
        if not request.user.can_assign_role(role.name):
            if role.name in ['Administrator', 'Risk Analyst', 'Compliance Auditor']:
                if not (request.user.is_superuser or request.user.has_role('Administrator')):
                    return Response(
                        {'error': f'You don\'t have permission to assign the role "{role.name}"'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Parse expires_at if provided
        if expires_at:
            try:
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {'error': 'Invalid expires_at format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        user_role = user.assign_role(
            role=role,
            assigned_by=request.user,
            expires_at=expires_at
        )
        
        serializer = UserRoleSerializer(user_role)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def remove_role(self, request, pk=None):
        """Remove role from specific user"""
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        if not role_id:
            return Response(
                {'error': 'role_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        role = get_object_or_404(Role, id=role_id)

        # Check if requesting user can remove this role
        if not request.user.can_assign_role(role.name):
            if role.name in ['Administrator', 'Risk Analyst', 'Compliance Auditor']:
                if not (request.user.is_superuser or request.user.has_role('Administrator')):
                    return Response(
                        {'error': f'You don\'t have permission to remove the role "{role.name}"'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        user.remove_role(role)
        
        return Response({
            'message': f'Role "{role.name}" removed from user "{user.email}"'
        })

    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        """Get all permissions for a user"""
        user = self.get_object()
        permissions = user.get_permissions()
        
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def check_permission(self, request, pk=None):
        """Check if user has specific permission"""
        user = self.get_object()
        serializer = UserPermissionCheckSerializer(data=request.data)
        
        if serializer.is_valid():
            permission_codename = serializer.validated_data['permission_codename']
            resource_type = serializer.validated_data.get('resource_type', '')
            resource_id = serializer.validated_data.get('resource_id', '')
            
            has_permission = user.has_permission(permission_codename)
            
            # Log permission check
            PermissionLog.objects.create(
                user=user,
                permission_codename=permission_codename,
                resource_type=resource_type,
                resource_id=resource_id,
                action='granted' if has_permission else 'denied',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:255]
            )
            
            return Response({
                'has_permission': has_permission,
                'permission_codename': permission_codename,
                'user_email': user.email
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def role_history(self, request, pk=None):
        """Get role assignment history for user"""
        user = self.get_object()
        
        # Get query parameters for date filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        user_roles = UserRole.objects.filter(user=user).select_related('role', 'assigned_by')
        
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                user_roles = user_roles.filter(assigned_at__gte=start_date)
            except ValueError:
                return Response(
                    {'error': 'Invalid start_date format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                user_roles = user_roles.filter(assigned_at__lte=end_date)
            except ValueError:
                return Response(
                    {'error': 'Invalid end_date format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = UserRoleSerializer(user_roles, many=True)
        return Response(serializer.data)
    
    
class RBACDashboardView(generics.GenericAPIView):
    """Dashboard view with RBAC statistics"""
    permission_classes = [IsAuthenticated, HasPermission('role_view')]
    
    def get(self, request):
        """Get dashboard statistics"""
        now = timezone.now()
        
        # Basic counts
        total_users = User.objects.count()
        total_roles = Role.objects.count()
        total_permissions = Permission.objects.count()
        active_assignments = UserRole.objects.filter(is_active=True).count()
        
        # Expiring assignments (next 7 days)
        expiring_soon = UserRole.objects.filter(
            is_active=True,
            expires_at__lte=now + timedelta(days=7),
            expires_at__gt=now
        ).count()
        
        # Expired assignments
        expired = UserRole.objects.filter(
            is_active=True,
            expires_at__lte=now
        ).count()
        
        # Most assigned roles
        popular_roles = Role.objects.annotate(
            assignment_count=Count('userrole', filter=Q(userrole__is_active=True))
        ).order_by('-assignment_count')[:5]
        
        # Recent activity (last 24 hours)
        recent_assignments = UserRole.objects.filter(
            assigned_at__gte=now - timedelta(days=1)
        ).count()
        
        # Permission check activity (last 24 hours)
        recent_permission_checks = PermissionLog.objects.filter(
            timestamp__gte=now - timedelta(days=1)
        ).count()
        
        return Response({
            'summary': {
                'total_users': total_users,
                'total_roles': total_roles,
                'total_permissions': total_permissions,
                'active_assignments': active_assignments,
                'expiring_soon': expiring_soon,
                'expired': expired
            },
            'popular_roles': [
                {
                    'id': role.id,
                    'name': role.name,
                    'assignment_count': role.assignment_count
                }
                for role in popular_roles
            ],
            'recent_activity': {
                'assignments_24h': recent_assignments,
                'permission_checks_24h': recent_permission_checks
            }
        })

    

class PermissionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for permission audit logs"""
    queryset = PermissionLog.objects.select_related('user')
    serializer_class = PermissionLogSerializer
    permission_classes = [IsAuthenticated, HasPermission('system_logs')]
    filterset_fields = ['user', 'permission_codename', 'action']
    search_fields = ['user__email', 'permission_codename', 'resource_type']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        """Get permission activity for specific user"""
        user_id = request.query_params.get('user_id')
        days = int(request.query_params.get('days', 30))
        
        if not user_id:
            return Response(
                {'error': 'user_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        start_date = timezone.now() - timedelta(days=days)
        logs = self.get_queryset().filter(
            user_id=user_id,
            timestamp__gte=start_date
        )
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def permission_usage(self, request):
        """Get usage statistics for permissions"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        usage_stats = self.get_queryset().filter(
            timestamp__gte=start_date
        ).values('permission_codename').annotate(
            total_checks=Count('id'),
            granted=Count('id', filter=Q(action='granted')),
            denied=Count('id', filter=Q(action='denied'))
        ).order_by('-total_checks')
        
        return Response(list(usage_stats))



class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginThrottle]

    @login_docs
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()
        
        if not email or not password:
            return Response(
                {"detail": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for account lockout
        if self._is_account_locked(email):
            logger.warning(
                f"Login attempt on locked account: {email}",
                extra={'email': email, 'ip': self._get_client_ip(request)}
            )
            return Response(
                {"detail": "Account temporarily locked due to multiple failed attempts"},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                self._handle_failed_login(email, request, 'Invalid credentials')
                return Response(
                    serializer.errors,
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            validated_data = serializer.validated_data
            user = serializer.user
            
            self._handle_successful_login(user, request)
            
            # Check for password expiration
            if user.is_password_expired():
                validated_data.update({
                    'requires_password_change': True,
                    'password_expired': True
                })
            
            if user.mfa_enabled and user.mfa_secret:
                return self._handle_mfa_required(user, validated_data)
            
            self._clear_failed_attempts(email)
            
            return Response(validated_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(
                f"Unexpected login error for {email}: {str(e)}", 
                exc_info=True,
                extra={'email': email, 'ip': self._get_client_ip(request)}
            )
            return Response(
                {"detail": "Login failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



    def _handle_successful_login(self, user, request):
        """Handle successful login logging and session management"""
        try:
            with transaction.atomic():
                # Create Login history record
                LoginHistory.objects.create(
                    user=user,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                    was_successful=True,
                    login_timestamp = timezone.now()
                )
                
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
                
                logger.info(
                    f"Successful login: {user.email}",
                    extra={
                        'user_id': user.id,
                        'email': user.email,
                        'ip': self._get_client_ip(request)
                    }
                )
        except Exception as e:
            logger.error(f"Error logging successful login: {str(e)}")

    def _handle_mfa_required(self, user, response_data):
        """Handle MFA requirement for login"""
        try:
            temp_token = default_token_generator.make_token(user)
            uid_encoded = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Store temp token in cache with short expiration
            cache_key = f"mfa_temp_token:{user.id}:{temp_token}"
            cache.set(cache_key, {
                'user_id': user.id,
                'email': user.email,
                'created_at': timezone.now().isoformat()
            }, timeout=300)

            # Ensure user data is present
            user_data = response_data.get('user') or {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'role': user.user_type,
                'mfa_enabled': user.mfa_enabled,
                'is_verified': user.is_verified,
            }
            
            mfa_response = {
                'requires_mfa': True,
                'temp_token': temp_token,
                'uid': uid_encoded,
                'user': user_data,
                'message': 'MFA verification required'
            }
            
            logger.info(f"MFA required for user: {user.email}")
            return Response(mfa_response, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error handling MFA requirement: {str(e)}")
            return Response(
                {"detail": "MFA setup error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _is_account_locked(self, email):
        """Check if account is locked due to failed attempts"""
        cache_key = f"failed_attempts:{email}"
        attempt_data = cache.get(cache_key, {})
        
        max_attempts = getattr(settings, 'MAX_LOGIN_ATTEMPTS', 5)
        lockout_duration = getattr(settings, 'LOGIN_LOCKOUT_DURATION', 3600)
        
        if not attempt_data:
            return False
            
        attempts = attempt_data.get('count', 0)
        last_attempt = attempt_data.get('last_attempt')
        
        if attempts >= max_attempts:
            if last_attempt:
                lockout_expiry = last_attempt + lockout_duration
                if timezone.now().timestamp() > lockout_expiry:
                    self._clear_failed_attempts(email)
                    return False
            return True
        
        return False

    def _handle_failed_login(self, email, request, reason):
        """Handle failed login attempt with enhanced tracking"""
        cache_key = f"failed_attempts:{email}"
        current_time = timezone.now()
        
        attempt_data = cache.get(cache_key, {
            'count': 0,
            'first_attempt': current_time.timestamp(),
            'attempts': []
        })
        
        # Update attempt data
        attempt_data['count'] += 1
        attempt_data['last_attempt'] = current_time.timestamp()
        attempt_data['attempts'].append({
            'timestamp': current_time.timestamp(),
            'ip': self._get_client_ip(request),
            'reason': reason
        })
        
        # Keep only recent attempts
        cutoff_time = current_time.timestamp() - 86400  # 24 hours
        attempt_data['attempts'] = [
            att for att in attempt_data['attempts'] 
            if att['timestamp'] > cutoff_time
        ]
        
        # Store updated attempt data
        cache.set(cache_key, attempt_data, timeout=3600)  # 1 hour
        
        # Log failed attempt
        try:
            user = User.objects.get(email=email)
            LoginHistory.objects.create(
                user=user,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                was_successful=False,
                failure_reason=reason,
                login_timestamp=current_time
            )
        except User.DoesNotExist:
            pass
            
        logger.warning(
            f"Failed login attempt: {email} - {reason}",
            extra={
                'email': email,
                'ip': self._get_client_ip(request),
                'attempt_count': attempt_data['count'],
                'reason': reason
            }
        )

    def _clear_failed_attempts(self, email):
        """Clear failed login attempts"""
        cache_key = f"failed_attempts:{email}"
        cache.delete(cache_key)

    def _get_client_ip(self, request):
        """Get client IP address with improved detection"""
        forwarded_ips = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_CLUSTER_CLIENT_IP',
        ]
        
        for header in forwarded_ips:
            ip_list = request.META.get(header)
            if ip_list:
                ip = ip_list.split(',')[0].strip()
                if ip:
                    return ip
        
        # Fallback to REMOTE_ADDR
        return request.META.get('REMOTE_ADDR', '0.0.0.0')



class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    parser_classes = [MultiPartParser, FormParser]

    @register_docs
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data) 
            if not serializer.is_valid():
                print(f"Registration validation errors: {serializer.errors}")
                return Response(
                    {"detail": "Validation failed", "errors": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            email = serializer.validated_data.get('email', '').lower()

            # Double-check for existing user
            if User.objects.filter(email=email).exists():
                return Response(
                    {"detail": "User with this email already exists"},
                    status=status.HTTP_409_CONFLICT
                )
            
            with transaction.atomic():
                user = serializer.save()
                
                # Send welcome email
                try:
                    send_welcome_email(user)
                except Exception as e:
                    logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
                
                logger.info(f"New user registered: {user.email}")

                # Get user's roles and permissions for response
                user_roles = [{'id': role.id, 'name': role.name} for role in user.get_roles()]
                
                return Response({
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                    'is_verified': user.is_verified,
                    'roles': user_roles,
                    'message': 'Registration successful. Client account created.'
                }, status=status.HTTP_201_CREATED)
                
        except serializers.ValidationError as e:
            logger.error(f"Validation error for registration: {str(e)}")
            return Response(
                {"detail": "Validation failed", "errors": e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Registration failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @get_user_profile_docs
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @update_user_profile_docs
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @partial_update_user_profile_docs
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    def get_object(self):
        """Get or create user profile"""
        profile, created = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={}
        )
        return profile
    
    def update(self, request, *args, **kwargs):
        """Override update to handle profile creation"""
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Profile update failed for user {request.user.email}: {str(e)}")
            return Response(
                {"detail": "Profile update failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserUpdateView(generics.UpdateAPIView):
    """Separate view for updating user account information"""
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            logger.info(f"User account updated: {request.user.email}")
            return response
        except Exception as e:
            logger.error(f"User update failed for {request.user.email}: {str(e)}")
            return Response(
                {"detail": "Account update failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@login_history_docs
class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        return self.request.user.login_history.select_related('user').order_by('-login_time')[:50]


@mfa_setup_docs
class MFASetupView(generics.GenericAPIView):
    serializer_class = MFASetupSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        enable = serializer.validated_data.get('enable', True)
        acknowledged = serializer.validated_data.get('backup_codes_acknowledged', False)
        
        try:
            with transaction.atomic():
                if enable and acknowledged:
                    return self._acknowledge_backup_codes(user)
                elif enable:
                    return self._enable_mfa(user)
                else:
                    return self._disable_mfa(user)
                    
        except Exception as e:
            logger.error(f"MFA Setup Error for {user.email}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to configure MFA. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def _enable_mfa(self, user):
        """Enable MFA for user"""
        if user.mfa_enabled:
            return Response(
                {'detail': 'MFA is already enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate new secret
        secret = pyotp.random_base32(length=32)
        codes, hashes = generate_backup_codes()
        
        user.mfa_secret = secret
        user.mfa_enabled = True
        user.backup_codes = hashes
        user.save()
        
        # Generate provisioning URI
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name=getattr(settings, 'MFA_ISSUER_NAME', 'RiskGuard Pro')
        )
        
        logger.info(f"MFA enabled for user: {user.email}")
        
        return Response({
            'status': 'success',
            'secret': secret,
            'uri': totp_uri,
            'backup_codes': codes,
            'message': 'Scan the QR code with your authenticator app and save your backup codes'
        })

    def _acknowledge_backup_codes(self, user):
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA must be enabled before acknowledging backup codes'},
                status=status.HTTP_400_BAD_REQUEST
        )

        # Log or flag acknowledgment — optional
        logger.info(f"User {user.email} acknowledged backup codes.")
        return Response({
            'status': 'success',
            'message': 'Backup codes acknowledged. MFA setup complete.'
    })


    def _disable_mfa(self, user):
        """Disable MFA for user"""
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.mfa_enabled = False
        user.mfa_secret = ''
        user.backup_codes = []
        user.save()
        
        logger.info(f"MFA disabled for user: {user.email}")
        
        return Response({
            'status': 'success',
            'message': 'MFA has been disabled'
        })


class MFASetupVerifyView(generics.GenericAPIView):
    """Verify MFA setup by validating the first TOTP code"""
    serializer_class = MFASetupVerifySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        mfa_code = serializer.validated_data.get('token')
        
        try:
            if not user.mfa_secret:
                return Response(
                    {'detail': 'MFA is not set up for this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if self._verify_mfa_code(user, mfa_code):
                # MFA setup verification successful
                logger.info(f"MFA setup verified for user: {user.email}")
                return Response({
                    'status': 'success',
                    'message': 'MFA setup verified successfully'
                })
            else:
                return Response(
                    {'detail': 'Invalid verification code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"MFA Setup Verification Error: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Verification failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _verify_mfa_code(self, user, code):
        """Verify MFA code with clock drift tolerance"""
        if not user.mfa_secret:
            return False
            
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(code, valid_window=1)

class MFAVerifyView(generics.GenericAPIView):
    serializer_class = MFAVerifySerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    @mfa_verify_docs
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uid = serializer.validated_data.get('uid')
        temp_token = serializer.validated_data.get('tempToken')
        mfa_code = serializer.validated_data.get('token')
        backup_code = serializer.validated_data.get('backup_code')
        
        try:
            user = self._get_user_from_token(uid, temp_token)
            
            # Verify MFA code or backup code
            if mfa_code and self._verify_mfa_code(user, mfa_code):
                return self._generate_final_tokens(user)
            elif backup_code and verify_backup_code(user, backup_code):
                logger.warning(f"Backup code used for MFA: {user.email}")
                return self._generate_final_tokens(user)
            else:
                self._log_mfa_failure(user, request)
                return Response(
                    {'detail': 'Invalid verification code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"MFA Verification Error: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Verification failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_user_from_token(self, uid, temp_token):
        """Extract and validate user from token"""
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
            
            # Check cache for temp token
            cache_key = f"mfa_temp_token:{user.id}:{temp_token}"
            cached_token = cache.get(cache_key)
            
            if not cached_token or cached_token != temp_token:
                raise ValidationError("Invalid or expired token")
                
            if not default_token_generator.check_token(user, temp_token):
                raise ValidationError("Invalid token")
                
            return user
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise ValidationError("Invalid user")
        


    def _verify_mfa_code(self, user, code):
        """Verify MFA code with clock drift tolerance"""
        if not user.mfa_secret:
            return False
            
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(code, valid_window=1)

    def _generate_final_tokens(self, user):
        """Generate final JWT tokens after successful MFA"""
        refresh = RefreshToken.for_user(user)
        
        # Clear temp token from cache
        cache_key = f"mfa_temp_token:{user.id}"
        cache.delete(cache_key)
        
        logger.info(f"MFA verification successful for: {user.email}")
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'role': user.user_type,
                'mfa_enabled': user.mfa_enabled,
                'is_verified': user.is_verified
            },
            'mfa_verified': True
        })

    def _log_mfa_failure(self, user, request):
        """Log MFA verification failure"""
        try:
            LoginHistory.objects.create(
                user=user,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                was_successful=False
            )
        except Exception as e:
            logger.error(f"Failed to log MFA failure: {str(e)}")

    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        return ip

    
       
class PasswordResetThrottle(AnonRateThrottle):
    rate = '3/hour'


@password_reset_request_docs
class PasswordResetRequestView(generics.GenericAPIView):
    throttle_classes = [PasswordResetThrottle]
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email'].lower()
        user = User.objects.filter(email=email, is_active=True).first()
        
        if user:
            try:
                # Generate password reset token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Store reset token in cache with expiration
                cache_key = f"password_reset:{user.id}"
                cache.set(cache_key, token, timeout=3600)  # 1 hour
                
                # Send password reset email
                send_password_reset_email(user, uid, token, request)
                
                logger.info(f"Password reset requested for: {user.email}")
                
            except Exception as e:
                logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        
        # Always return success to prevent email enumeration
        return Response(
            {'detail': 'If an account exists with this email, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )


@password_reset_confirm_docs
class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid, is_active=True)
            token = serializer.validated_data['token']
            
            # Check cached token
            cache_key = f"password_reset:{user.id}"
            cached_token = cache.get(cache_key)
            
            if cached_token != token or not default_token_generator.check_token(user, token):
                return Response(
                    {'detail': 'Invalid or expired reset link.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reset password
            with transaction.atomic():
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                # Clear the reset token
                cache.delete(cache_key)
                
                # Log password reset
                logger.info(f"Password reset completed for: {user.email}")
                
            return Response(
                {'detail': 'Password has been reset successfully.'},
                status=status.HTTP_200_OK
            )
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Password reset failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Verify old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                logger.info(f"Password changed for user: {user.email}")
                
            return Response(
                {'detail': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Password change failed for {user.email}: {str(e)}")
            return Response(
                {'detail': 'Password change failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

class PasswordChangeRequiredView(generics.GenericAPIView):
    """Handle forced password changes for expired passwords"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordChangeSerializer
    
    @password_change_required_get_docs
    def get(self, request):
        return Response({
            'detail': 'Your password has expired and must be changed',
            'password_expired': True,
            'last_change': request.user.last_password_change
        }, status=status.HTTP_403_FORBIDDEN)
    

    @password_change_required_post_docs
    def post(self, request):
        """Force password change for expired passwords"""
        if not request.user.is_password_expired():
            return Response(
                {'detail': 'Password change not required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Verify old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                logger.info(f"Expired password changed for user: {user.email}")
                
            return Response(
                {'detail': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Expired password change failed for {user.email}: {str(e)}")
            return Response(
                {'detail': 'Password change failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )