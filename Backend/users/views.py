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
from django.db.models import Q, Count, Prefetch, Max, Case, When, Value, CharField
from django.core.cache import cache
from .models import Permission, Role, UserRole, PermissionLog, User, LoginHistory
from .permissions import (
    RequirePermission,
    RequireOwnerOrPermission,
    CanViewAuditLogs,
    RBACMixin,
    IsAdminUser
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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), RequirePermission('manage_permissions')()]
        else:
            return [permissions.IsAuthenticated(), RequirePermission('view_permissions')()]

    @action(detail=False, methods=['get'])
    def by_content_type(self, request):
        """Get permissions grouped by content type"""
        permissions_qs = self.get_queryset().select_related('content_type')
        grouped = {}
        
        for perm in permissions_qs:
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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), RequirePermission('role_edit')()]
        else:
            return [permissions.IsAuthenticated(), RequirePermission('role_view')()]

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
    required_permission = 'user_manage_roles'

    queryset = UserRole.objects.select_related('user', 'role', 'assigned_by')
    serializer_class = UserRoleSerializer
    filterset_fields = ['is_active', 'role', 'user']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'role__name']
    ordering_fields = ['assigned_at', 'expires_at']
    ordering = ['-assigned_at']

    def get_permissions(self):
        """Apply different permissions for read vs write operations"""
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated(), RequirePermission('role_view')()]
        else:
            return [permissions.IsAuthenticated(), RequirePermission('user_manage_roles')()]

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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), RequirePermission('user_manage')()]
        else:
            # For viewing, allow users with admin access
            return [permissions.IsAuthenticated(), IsAdminUser()]
    
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
    required_permissions = 'view_dashboard'
    
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
    permission_classes = [permissions.IsAuthenticated, CanViewAuditLogs]
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

            if user.mfa_enabled:
                if user.mfa_secret and user.is_mfa_fully_configured:
                    return self._handle_mfa_required(user, validated_data)
                else:
                    return self._handle_mfa_setup_required(user, validated_data)
            
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
        
    def _handle_mfa_setup_required(self, user, response_data):
        """"Handle MFA setup requirement for login"""
        try:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            user_data = response_data.get('user') or {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'role': user.user_type,
                'mfa_enabled': user.mfa_enabled,
                'mfa_fully_configured': user.is_mfa_fully_configured,
                'is_verified': user.is_verified,
                'roles': [{'id': role.id, 'name': role.name} for role in user.get_roles()],
                'permissions': [perm.codename for perm in user.get_permissions()],
            }

            setup_response = {
                'requires_mfa_setup': True,
                'requires_mfa': False,
                'user': user_data,
                'access': access_token,
                'refresh': refresh_token,
                'message': 'MFA setup completion required',
            }

            logger.info(f"MFA setup required for user: {user.email}")
            return Response(setup_response, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error handling MFA setup requirement: {str(e)}")
            return Response(
                {"detail": "MFA setup error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
    """User profile management with RBAC Permissions"""
    serializer_class = UserProfileSerializer

    def get_permissions(self):
        """Apply RBAC based on action and ownership"""
        permission_classes = [permissions.IsAuthenticated]
        
        if self.request.method in ['PUT', 'PATCH']:
            # Users can edit their own profile, or admins can edit any profile
            permission_classes.append(
                RequireOwnerOrPermission('user_edit_all', owner_field='user')
            )
        else:
            # Users can view their own profile, or staff can view any profile
            permission_classes.append(
                RequireOwnerOrPermission('user_view_all', owner_field='user')
            )
        
        return [permission() for permission in permission_classes]

    @get_user_profile_docs
    def get(self, request, *args, **kwargs):
        """Get user profile with permission logging"""
        profile = self.get_object()
        # Log profile view if not the owner
        if profile.user != request.user:
            logger.info(
                f"User {request.user.email} viewed profile of {profile.user.email}",
                extra={
                    'viewer_id': request.user.id,
                    'profile_owner_id': profile.user.id,
                    'action': 'profile_view'
                }
            )
        
        return super().get(request, *args, **kwargs)

    @update_user_profile_docs
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @partial_update_user_profile_docs
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    def get_object(self):
        """Get profile based on URL parameter or current user"""
        # Check if profile_id is in URL (for admin access)
        profile_id = self.kwargs.get('pk')
        
        if profile_id:
            # Admin accessing specific user's profile
            profile = get_object_or_404(UserProfile, id=profile_id)
            
            # Check if user can access this profile
            if (profile.user != self.request.user and 
                not self.request.user.has_permission('user_view_all')):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to access this profile")
                
            return profile
        else:
            # User accessing their own profile
            profile, created = UserProfile.objects.get_or_create(
                user=self.request.user,
                defaults={}
            )
            return profile
    
    def update(self, request, *args, **kwargs):
        """Override update with proper logging"""
        try:
            profile = self.get_object()
            
            if profile.user != request.user:
                logger.info(
                    f"Admin {request.user.email} updated profile of {profile.user.email}",
                    extra={
                        'admin_id': request.user.id,
                        'profile_owner_id': profile.user.id,
                        'action': 'profile_update',
                        'changes': list(request.data.keys())
                    }
                )
            
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Profile update failed: {str(e)}")
            return Response(
                {"detail": "Profile update failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class UserUpdateView(generics.UpdateAPIView):
    """User account information update with RBAC Permissions"""
    serializer_class = UserUpdateSerializer

    def get_permissions(self):
        """Users can edit their own account, admins can edit any account"""
        return [
            permissions.IsAuthenticated(),
            RequireOwnerOrPermission('user_edit_all')()
        ]

    def get_object(self):
        """Get user based on URL parameter or current user"""
        user_id = self.kwargs.get('pk')
        
        if user_id:
            # Admin accessing specific user
            user = get_object_or_404(User, id=user_id)
            
            # Check permissions
            if (user != self.request.user and 
                not self.request.user.has_permission('user_edit_all')):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to update this user")
                
            return user
        else:
            # User updating themselves
            return self.request.user

    def update(self, request, *args, **kwargs):
        """Override update with logging and validation"""
        try:
            user = self.get_object()
            old_data = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number
            }
            
            response = super().update(request, *args, **kwargs)
            
            # Log account update
            if user != request.user:
                logger.info(
                    f"Admin {request.user.email} updated account of {user.email}",
                    extra={
                        'admin_id': request.user.id,
                        'target_user_id': user.id,
                        'action': 'account_update',
                        'old_data': old_data,
                        'new_data': request.data
                    }
                )
            else:
                logger.info(f"User {user.email} updated their account")
            
            return response
        except Exception as e:
            logger.error(f"User update failed for {self.get_object().email}: {str(e)}")
            return Response(
                {"detail": "Account update failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



@login_history_docs
class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    throttle_classes = [UserRateThrottle]

    def get_permissions(self):
        """Users can view their own history, admins/auditors can view any history"""
        return [
            permissions.IsAuthenticated(),
            # Allow if user is viewing own history OR has permission to view all
            RequirePermission('user_view_all')() if self.kwargs.get('user_id') else permissions.AllowAny()
        ]

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        """Get login history based on permissions"""
        user_id = self.kwargs.get('user_id')
        
        if user_id:
            # Admin/auditor viewing specific user's history
            if not self.request.user.has_permission('user_view_all'):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to view other users' login history")
            
            target_user = get_object_or_404(User, id=user_id)
            
            # Log admin access to user's login history
            logger.info(
                f"Admin {self.request.user.email} accessed login history of {target_user.email}",
                extra={
                    'admin_id': self.request.user.id,
                    'target_user_id': target_user.id,
                    'action': 'login_history_view'
                }
            )
            
            return target_user.login_history.select_related('user').order_by('-login_timestamp')[:50]
        else:
            # User viewing their own history
            return self.request.user.login_history.select_related('user').order_by('-login_timestamp')[:50]


@mfa_setup_docs
class MFASetupView(generics.GenericAPIView):
    serializer_class = MFASetupSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, *args, **kwargs):
        """Setup MFA for authenticated user only"""
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
        if user.mfa_enabled and user.mfa_secret and user.is_mfa_fully_configured:
            return Response(
                {'detail': 'MFA is already fully configured'},
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
        
        logger.info(f"MFA enabled/re-configured for user: {user.email}")
        
        return Response({
            'status': 'success',
            'secret': secret,
            'uri': totp_uri,
            'backup_codes': codes,
            'message': 'Scan the QR code with your authenticator app and save your backup codes'
        })

    def _acknowledge_backup_codes(self, user):
        """Acknowledge backup codes after MFA setup"""
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA must be enabled before acknowledging backup codes'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
        """Verify MFA setup for current user only"""
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
        """Verify MFA during login process"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uid = serializer.validated_data.get('uid')
        temp_token = serializer.validated_data.get('tempToken')
        mfa_code = serializer.validated_data.get('token')
        backup_code = serializer.validated_data.get('backup_code')
        
        try:
            user = self._get_user_from_token(uid, temp_token)
            
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
            
            cache_key = f"mfa_temp_token:{user.id}:{temp_token}"
            cached_token = cache.get(cache_key)
            
            if not cached_token:
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
        
        cache_key_pattern = f"mfa_temp_token:{user.id}:*"
        cache.delete(cache_key_pattern)
        
        logger.info(f"MFA verification successful for: {user.email}")

        # Include roles and permissions in response
        user_roles = [{'id': role.id, 'name': role.name} for role in user.get_roles()]
        user_permissions = [perm.codename for perm in user.get_permissions()]
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'role': user.user_type,
                'mfa_enabled': user.mfa_enabled,
                'is_verified': user.is_verified,
                'roles': user_roles,
                'permissions': user_permissions
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
                was_successful=False,
                failure_reason='MFA verification failed',
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
    """Request password reset with email verification"""
    throttle_classes = [PasswordResetThrottle]
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        """Handle password reset request"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email'].lower()
        user = User.objects.filter(email=email, is_active=True).first()
        
        if user:
            try:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                cache_key = f"password_reset:{user.id}"
                cache.set(cache_key, token, timeout=3600)  # 1 hour
                
                send_password_reset_email(user, uid, token, request)
                
                logger.info(f"Password reset requested for: {user.email}")
                
            except Exception as e:
                logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        
        return Response(
            {'detail': 'If an account exists with this email, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )


@password_reset_confirm_docs
class PasswordResetConfirmView(generics.GenericAPIView):
    """Confirm password reset with token validation"""
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        """Handle password reset confirmation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid, is_active=True)
            token = serializer.validated_data['token']
            
            cache_key = f"password_reset:{user.id}"
            cached_token = cache.get(cache_key)
            
            if cached_token != token or not default_token_generator.check_token(user, token):
                return Response(
                    {'detail': 'Invalid or expired reset link.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                cache.delete(cache_key)
                
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
    """Password change for authenticated users"""
    serializer_class = PasswordChangeSerializer
    
    def get_permissions(self):
        """Users can change their own password, admins can change any password"""
        user_id = self.kwargs.get('user_id')
        
        if user_id:
            # Admin changing another user's password
            return [
                permissions.IsAuthenticated(),
                RequirePermission('user_edit_all')()
            ]
        else:
            # User changing their own password
            return [permissions.IsAuthenticated()]
    
    throttle_classes = [UserRateThrottle]

    def get_target_user(self):
        """Get the user whose password is being changed"""
        user_id = self.kwargs.get('user_id')
        
        if user_id:
            # Admin changing another user's password
            if not self.request.user.has_permission('user_edit_all'):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to change other users' passwords")
            
            return get_object_or_404(User, id=user_id)
        else:
            # User changing their own password
            return self.request.user

    def post(self, request, *args, **kwargs):
        """Change password with proper validation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_user = self.get_target_user()
        
        if target_user != request.user:
            # Admin changing another user's password
            if 'old_password' in serializer.validated_data:
                # Verify old password if provided
                if not target_user.check_password(serializer.validated_data['old_password']):
                    return Response(
                        {'detail': 'Current password is incorrect'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        else:
            # User changing their own password - old password required
            if not target_user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'detail': 'Current password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            with transaction.atomic():
                target_user.set_password(serializer.validated_data['new_password'])
                target_user.last_password_change = timezone.now()
                target_user.save()
                
                # Log password change
                if target_user != request.user:
                    logger.info(
                        f"Admin {request.user.email} changed password for user: {target_user.email}",
                        extra={
                            'admin_id': request.user.id,
                            'target_user_id': target_user.id,
                            'action': 'admin_password_change'
                        }
                    )
                else:
                    logger.info(f"Password changed for user: {target_user.email}")
                
            return Response(
                {'detail': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Password change failed for {target_user.email}: {str(e)}")
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
        """Check if password change is required"""
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



# Admin-only views for user management
class AdminPasswordResetView(generics.GenericAPIView):
    """Admin can reset any user's password"""
    permission_classes = [permissions.IsAuthenticated, RequirePermission('user_edit_all')]
    
    def post(self, request, user_id):
        """Admin reset user password"""
        target_user = get_object_or_404(User, id=user_id)
        
        # Generate temporary password
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        try:
            with transaction.atomic():
                target_user.set_password(temp_password)
                target_user.last_password_change = timezone.now()
                target_user.save()
                
                logger.info(
                    f"Admin {request.user.email} reset password for user: {target_user.email}",
                    extra={
                        'admin_id': request.user.id,
                        'target_user_id': target_user.id,
                        'action': 'admin_password_reset'
                    }
                )
                
            return Response({
                'detail': 'Password reset successfully',
                'temporary_password': temp_password,
                'message': 'User should change this password immediately'
            })
            
        except Exception as e:
            logger.error(f"Admin password reset failed: {str(e)}")
            return Response(
                {'detail': 'Password reset failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserAccountStatusView(generics.GenericAPIView):
    """Admin can activate/deactivate user accounts"""
    permission_classes = [permissions.IsAuthenticated, RequirePermission('user_edit_all')]
    
    def post(self, request, user_id):
        """Toggle user account status"""
        target_user = get_object_or_404(User, id=user_id)
        action = request.data.get('action')  # 'activate' or 'deactivate'
        
        if action not in ['activate', 'deactivate']:
            return Response(
                {'detail': 'Action must be either "activate" or "deactivate"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent self-deactivation
        if target_user == request.user and action == 'deactivate':
            return Response(
                {'detail': 'You cannot deactivate your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                target_user.is_active = (action == 'activate')
                target_user.save()
                
                logger.info(
                    f"Admin {request.user.email} {action}d user: {target_user.email}",
                    extra={
                        'admin_id': request.user.id,
                        'target_user_id': target_user.id,
                        'action': f'user_{action}'
                    }
                )
                
            return Response({
                'detail': f'User account {action}d successfully',
                'user_id': target_user.id,
                'is_active': target_user.is_active
            })
            
        except Exception as e:
            logger.error(f"Account status change failed: {str(e)}")
            return Response(
                {'detail': 'Account status change failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkUserActionsView(generics.GenericAPIView):
    """Bulk actions for user management (admin only)"""
    permission_classes = [permissions.IsAuthenticated, RequirePermission('user_edit_all')]
    
    def post(self, request):
        """Perform bulk actions on users"""
        user_ids = request.data.get('user_ids', [])
        action = request.data.get('action')
        
        if not user_ids:
            return Response(
                {'detail': 'user_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action not in ['activate', 'deactivate', 'delete', 'reset_password']:
            return Response(
                {'detail': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        users = User.objects.filter(id__in=user_ids)
        
        if request.user.id in user_ids and action in ['deactivate', 'delete']:
            return Response(
                {'detail': f'You cannot {action} your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = {
            'success': [],
            'failed': [],
            'total_requested': len(user_ids)
        }
        
        try:
            with transaction.atomic():
                for user in users:
                    try:
                        if action == 'activate':
                            user.is_active = True
                            user.save()
                        elif action == 'deactivate':
                            user.is_active = False
                            user.save()
                        elif action == 'delete':
                            if user.is_superuser:
                                results['failed'].append({
                                    'user_id': user.id,
                                    'email': user.email,
                                    'reason': 'Cannot delete superuser'
                                })
                                continue
                            user.delete()
                        elif action == 'reset_password':
                            import secrets
                            import string
                            temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
                            user.set_password(temp_password)
                            user.save()
                            results['success'].append({
                                'user_id': user.id,
                                'email': user.email,
                                'temp_password': temp_password
                            })
                            continue
                        
                        results['success'].append({
                            'user_id': user.id,
                            'email': user.email
                        })
                        
                    except Exception as e:
                        results['failed'].append({
                            'user_id': user.id,
                            'email': user.email,
                            'reason': str(e)
                        })
                
                logger.info(
                    f"Admin {request.user.email} performed bulk {action} on {len(results['success'])} users",
                    extra={
                        'admin_id': request.user.id,
                        'action': f'bulk_{action}',
                        'success_count': len(results['success']),
                        'failed_count': len(results['failed'])
                    }
                )
            
            return Response({
                'detail': f'Bulk {action} completed',
                'results': results
            })
            
        except Exception as e:
            logger.error(f"Bulk user action failed: {str(e)}")
            return Response(
                {'detail': 'Bulk action failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserPermissionSummaryView(generics.GenericAPIView):
    """Get comprehensive permission summary for a user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Users can view their own summary, admins can view any user's summary"""
        user_id = self.kwargs.get('user_id')
        
        if user_id and str(user_id) != str(self.request.user.id):
            return [
                permissions.IsAuthenticated(),
                RequirePermission('user_view_all')()
            ]
        return [permissions.IsAuthenticated()]
    
    def get(self, request, user_id=None):
        """Get detailed permission summary"""
        if user_id:
            # Admin viewing another user's permissions
            target_user = get_object_or_404(User, id=user_id)
            if (target_user != request.user and 
                not request.user.has_permission('user_view_all')):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to view this user's permissions")
        else:
            # User viewing their own permissions
            target_user = request.user
        
        # Get roles and permissions
        roles = target_user.get_roles()
        permissions = target_user.get_permissions()
        
        # Organize permissions by category
        permission_categories = {}
        for perm in permissions:
            category = perm.codename.split('_')[0]
            if category not in permission_categories:
                permission_categories[category] = []
            permission_categories[category].append({
                'id': perm.id,
                'codename': perm.codename,
                'name': perm.name,
                'description': perm.description
            })
        
        if target_user != request.user:
            logger.info(
                f"Admin {request.user.email} viewed permission summary for {target_user.email}",
                extra={
                    'admin_id': request.user.id,
                    'target_user_id': target_user.id,
                    'action': 'permission_summary_view'
                }
            )
        
        return Response({
            'user': {
                'id': target_user.id,
                'email': target_user.email,
                'name': f"{target_user.first_name} {target_user.last_name}",
                'user_type': target_user.user_type
            },
            'roles': [
                {
                    'id': role.id,
                    'name': role.name,
                    'description': role.description,
                    'permission_count': role.permissions.count()
                }
                for role in roles
            ],
            'permissions_by_category': permission_categories,
            'total_permissions': permissions.count(),
            'summary': {
                'can_view_users': target_user.has_permission('user_view_all'),
                'can_edit_users': target_user.has_permission('user_edit_all'),
                'can_manage_roles': target_user.has_permission('user_manage_roles'),
                'can_view_reports': target_user.has_permission('report_view'),
                'can_access_admin': target_user.has_permission('system_settings'),
                'is_admin': target_user.has_role('Administrator'),
                'is_staff': target_user.has_role('Risk Analyst') or target_user.has_role('Compliance Auditor'),
            }
        })


class MyPermissionsView(generics.GenericAPIView):
    """Quick view for current user's permissions"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get current user's permissions for frontend use"""
        user = request.user
        
        permissions = {
            'user_management': {
                'can_view_all_users': user.has_permission('user_view_all'),
                'can_edit_all_users': user.has_permission('user_edit_all'),
                'can_delete_users': user.has_permission('user_delete'),
                'can_manage_roles': user.has_permission('user_manage_roles'),
            },
            'role_management': {
                'can_view_roles': user.has_permission('role_view'),
                'can_create_roles': user.has_permission('role_create'),
                'can_edit_roles': user.has_permission('role_edit'),
                'can_delete_roles': user.has_permission('role_delete'),
                'can_assign_roles': user.has_permission('role_assign'),
            },
            'system': {
                'can_access_settings': user.has_permission('system_settings'),
                'can_view_logs': user.has_permission('system_logs'),
                'can_view_audit_logs': user.has_permission('view_audit_logs'),
                'can_view_dashboard': user.has_permission('view_dashboard'),
            },
            'data': {
                'can_export_data': user.has_permission('data_export'),
                'can_import_data': user.has_permission('data_import'),
                'can_delete_data': user.has_permission('data_delete'),
            },
            'reporting': {
                'can_view_reports': user.has_permission('report_view'),
                'can_create_reports': user.has_permission('report_create'),
                'can_manage_reports': user.has_permission('report_admin'),
            },
            'risk_management': {
                'can_view_risk': user.has_permission('risk_view'),
                'can_edit_risk': user.has_permission('risk_edit'),
                'can_approve_risk': user.has_permission('risk_approve'),
                'can_delete_risk': user.has_permission('risk_delete'),
            },
            'compliance': {
                'can_view_compliance': user.has_permission('compliance_view'),
                'can_edit_compliance': user.has_permission('compliance_edit'),
                'can_audit_compliance': user.has_permission('compliance_audit'),
            },
            'client_management': {
                'can_view_clients': user.has_permission('client_view'),
                'can_edit_clients': user.has_permission('client_edit'),
                'can_delete_clients': user.has_permission('client_delete'),
            }
        }
        
        # Get roles
        roles = [
            {
                'id': role.id,
                'name': role.name
            }
            for role in user.get_roles()
        ]
        
        # Get permission codes
        permission_codes = [perm.codename for perm in user.get_permissions()]
        
        return Response({
            'user_id': user.id,
            'user_type': user.user_type,
            'roles': roles,
            'permissions': permissions,
            'permission_codes': permission_codes,
            'is_superuser': user.is_superuser
        })


class SecurityAuditView(generics.GenericAPIView):
    """Security audit and monitoring (admin only)"""
    permission_classes = [permissions.IsAuthenticated, RequirePermission('view_audit_logs')]
    
    def get(self, request):
        """Get security audit information"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Failed login attempts
        failed_logins = LoginHistory.objects.filter(
            was_successful=False,
            login_timestamp__gte=start_date
        ).count()
        
        # Successful logins
        successful_logins = LoginHistory.objects.filter(
            was_successful=True,
            login_timestamp__gte=start_date
        ).count()
        
        # Permission denials
        permission_denials = PermissionLog.objects.filter(
            action='denied',
            timestamp__gte=start_date
        ).count()
        
        # Most denied permissions
        top_denied_permissions = PermissionLog.objects.filter(
            action='denied',
            timestamp__gte=start_date
        ).values('permission_codename').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Users with most permission denials
        top_denied_users = PermissionLog.objects.filter(
            action='denied',
            timestamp__gte=start_date
        ).values('user__email').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Recent suspicious activity
        suspicious_ips = LoginHistory.objects.filter(
            was_successful=False,
            login_timestamp__gte=start_date
        ).values('ip_address').annotate(
            count=Count('id')
        ).filter(count__gte=5).order_by('-count')[:10]
        
        return Response({
            'period_days': days,
            'summary': {
                'failed_logins': failed_logins,
                'successful_logins': successful_logins,
                'permission_denials': permission_denials,
                'login_success_rate': (successful_logins / (successful_logins + failed_logins) * 100) if (successful_logins + failed_logins) > 0 else 0
            },
            'top_denied_permissions': list(top_denied_permissions),
            'top_denied_users': list(top_denied_users),
            'suspicious_ips': list(suspicious_ips),
            'recommendations': self._get_security_recommendations(
                failed_logins, permission_denials, len(suspicious_ips)
            )
        })
    
    def _get_security_recommendations(self, failed_logins, permission_denials, suspicious_ip_count):
        """Generate security recommendations"""
        recommendations = []
        
        if failed_logins > 100:
            recommendations.append({
                'type': 'warning',
                'message': 'High number of failed login attempts detected. Consider implementing stricter rate limiting.'
            })
        
        if permission_denials > 50:
            recommendations.append({
                'type': 'info',
                'message': 'High number of permission denials. Review user roles and permissions.'
            })
        
        if suspicious_ip_count > 5:
            recommendations.append({
                'type': 'critical',
                'message': 'Multiple IPs with suspicious activity. Consider implementing IP blocking.'
            })
        
        if not recommendations:
            recommendations.append({
                'type': 'success',
                'message': 'No immediate security concerns detected.'
            })
        
        return recommendations


class AdminUsersListView(generics.ListAPIView):
    """
    Admin endpoint to view all users with comprehensive information
    including roles, status, login activity, and statistics
    """
    # required_permissions = 'user_view_all'
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Optimized queryset with all necessary data"""
        return User.objects.select_related(
            'profile'
        ).prefetch_related(
            'user_roles__role',
            'login_history'
        ).annotate(
            last_login_time=Max('login_history__login_timestamp'),
            
            # Login stats
            total_logins=Count('login_history', filter=Q(login_history__was_successful=True)),
            failed_logins=Count('login_history', filter=Q(login_history__was_successful=False)),
            
            # Recent activity (last 30 days)
            recent_logins=Count(
                'login_history', 
                filter=Q(
                    login_history__was_successful=True,
                    login_history__login_timestamp__gte=timezone.now() - timedelta(days=30)
                )
            ),
            
            user_status=Case(
                When(is_active=False, then=Value('Inactive')),
                When(
                    Q(last_login__isnull=True) | 
                    Q(last_login__lt=timezone.now() - timedelta(days=90)),
                    then=Value('Dormant')
                ),
                When(
                    last_login__gte=timezone.now() - timedelta(days=7),
                    then=Value('Active')
                ),
                When(
                    last_login__gte=timezone.now() - timedelta(days=30),
                    then=Value('Recently Active')
                ),
                default=Value('Inactive'),
                output_field=CharField()
            )
        ).order_by('-date_joined')

    def list(self, request, *args, **kwargs):
        """Enhanced list with filtering, search, and pagination"""
        search = request.query_params.get('search', '')
        user_type = request.query_params.get('user_type', '')
        status_filter = request.query_params.get('status', '')
        role_filter = request.query_params.get('role', '')
        is_active = request.query_params.get('is_active', '')
        has_mfa = request.query_params.get('has_mfa', '')
        sort_by = request.query_params.get('sort_by', '-date_joined')
        
        queryset = self.get_queryset()
        
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        if is_active:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        if has_mfa:
            has_mfa_bool = has_mfa.lower() == 'true'
            queryset = queryset.filter(mfa_enabled=has_mfa_bool)
        
        if role_filter:
            queryset = queryset.filter(
                user_roles__role__name=role_filter,
                user_roles__is_active=True
            )
        
        if status_filter:
            if status_filter == 'Active':
                queryset = queryset.filter(
                    is_active=True,
                    last_login__gte=timezone.now() - timedelta(days=7)
                )
            elif status_filter == 'Recently Active':
                queryset = queryset.filter(
                    is_active=True,
                    last_login__gte=timezone.now() - timedelta(days=30),
                    last_login__lt=timezone.now() - timedelta(days=7)
                )
            elif status_filter == 'Dormant':
                queryset = queryset.filter(
                    Q(last_login__isnull=True) | 
                    Q(last_login__lt=timezone.now() - timedelta(days=90))
                )
            elif status_filter == 'Inactive':
                queryset = queryset.filter(is_active=False)
        
        if sort_by in ['email', '-email', 'first_name', '-first_name', 'last_name', '-last_name', 
                       'date_joined', '-date_joined', 'last_login', '-last_login', 'user_type', '-user_type']:
            queryset = queryset.order_by(sort_by)
        
        queryset = queryset.distinct()
        
        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer_data = self._serialize_users(page)
            return self.get_paginated_response(serializer_data)
        
        # If no pagination
        serializer_data = self._serialize_users(queryset)
        
        summary = self._get_summary_stats(User.objects.all())
        
        logger.info(
            f"Admin {request.user.email} accessed users list",
            extra={
                'admin_id': request.user.id,
                'action': 'users_list_view',
                'filters': {
                    'search': search,
                    'user_type': user_type,
                    'status': status_filter,
                    'role': role_filter
                }
            }
        )
        
        return Response({
            'results': serializer_data,
            'summary': summary,
            'filters_applied': {
                'search': search,
                'user_type': user_type,
                'status': status_filter,
                'role': role_filter,
                'is_active': is_active,
                'has_mfa': has_mfa,
                'sort_by': sort_by
            }
        })

    def _serialize_users(self, users):
        """Custom serialization with all required fields"""
        data = []
        
        for user in users:
            active_roles = []
            expired_roles = []
            
            for user_role in user.user_roles.filter(role__is_active=True):
                role_data = {
                    'id': user_role.role.id,
                    'name': user_role.role.name,
                    'assigned_at': user_role.assigned_at,
                    'assigned_by': user_role.assigned_by.email if user_role.assigned_by else None,
                    'expires_at': user_role.expires_at,
                    'is_expired': user_role.is_expired
                }
                
                if user_role.is_active and not user_role.is_expired:
                    active_roles.append(role_data)
                else:
                    expired_roles.append(role_data)
            
            recent_login = user.login_history.filter(was_successful=True).first()
            last_failed_login = user.login_history.filter(was_successful=False).first()
            
            now = timezone.now()
            detailed_status = self._get_detailed_status(user, now)
            
            profile_data = {}
            if hasattr(user, 'profile'):
                profile_data = {
                    'company': user.profile.company,
                    'job_title': user.profile.job_title,
                    'department': user.profile.department,
                    'profile_picture_url': user.profile.profile_picture.url if user.profile.profile_picture else None
                }
            
            user_data = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'user_type': user.user_type,
                'user_type_display': user.get_user_type_display(),
                
                # Status Information
                'is_active': user.is_active,
                'is_verified': user.is_verified,
                'is_superuser': user.is_superuser,
                'status': detailed_status,
                
                # Dates
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'last_login_time': getattr(user, 'last_login_time', None),
                'last_password_change': user.last_password_change,
                
                # Security
                'mfa_enabled': user.mfa_enabled,
                'mfa_fully_configured': user.is_mfa_fully_configured,
                'password_expired': user.is_password_expired(),
                
                # Roles
                'active_roles': active_roles,
                'expired_roles': expired_roles,
                'role_count': len(active_roles),
                'primary_role': active_roles[0]['name'] if active_roles else None,
                
                # Activity Stats
                'total_logins': getattr(user, 'total_logins', 0),
                'failed_logins': getattr(user, 'failed_logins', 0),
                'recent_logins': getattr(user, 'recent_logins', 0),
                
                # Recent Activity
                'last_successful_login': {
                    'timestamp': recent_login.login_timestamp if recent_login else None,
                    'ip_address': recent_login.ip_address if recent_login else None,
                    'user_agent': recent_login.user_agent if recent_login else None
                } if recent_login else None,
                
                'last_failed_login': {
                    'timestamp': last_failed_login.login_timestamp if last_failed_login else None,
                    'ip_address': last_failed_login.ip_address if last_failed_login else None,
                    'failure_reason': last_failed_login.failure_reason if last_failed_login else None
                } if last_failed_login else None,
                
                # Contact & Profile
                'phone_number': user.phone_number,
                'profile': profile_data,
                
                # Computed Fields
                'days_since_joined': (now - user.date_joined).days,
                'days_since_last_login': (now - user.last_login).days if user.last_login else None,
                'risk_score': self._calculate_risk_score(user),
            }
            
            data.append(user_data)
        
        return data

    def _get_detailed_status(self, user, now):
        """Get detailed status classification"""
        if not user.is_active:
            return 'Inactive'
        
        if not user.last_login:
            return 'Never Logged In'
        
        days_since_login = (now - user.last_login).days
        
        if days_since_login <= 1:
            return 'Active'
        elif days_since_login <= 7:
            return 'Recently Active'
        elif days_since_login <= 30:
            return 'Moderately Active'
        elif days_since_login <= 90:
            return 'Dormant'
        else:
            return 'Long Inactive'

    def _calculate_risk_score(self, user):
        """Calculate a simple risk score based on various factors"""
        score = 0
        
        # No MFA
        if not user.mfa_enabled:
            score += 30
        
        # Password expired
        if user.is_password_expired():
            score += 25
        
        # Never logged in
        if not user.last_login:
            score += 20
        
        # High failed login attempts
        failed_count = getattr(user, 'failed_logins', 0)
        if failed_count > 10:
            score += 15
        elif failed_count > 5:
            score += 10
        
        # Long time since last login
        if user.last_login:
            days_since_login = (timezone.now() - user.last_login).days
            if days_since_login > 90:
                score += 20
            elif days_since_login > 30:
                score += 10
        
        # No verified email
        if not user.is_verified:
            score += 15
        
        return min(score, 100)

    def _get_summary_stats(self, all_users):
        """Get summary statistics for the dashboard"""
        now = timezone.now()
        
        total_users = all_users.count()
        active_users = all_users.filter(is_active=True).count()
        inactive_users = total_users - active_users
        
        # Users by type
        user_types = {}
        for choice in User.USER_TYPES:
            user_types[choice[0]] = {
                'code': choice[0],
                'display': choice[1],
                'count': all_users.filter(user_type=choice[0]).count()
            }
        
        # Activity stats
        never_logged_in = all_users.filter(last_login__isnull=True).count()
        logged_in_today = all_users.filter(
            last_login__gte=now - timedelta(days=1)
        ).count()
        logged_in_week = all_users.filter(
            last_login__gte=now - timedelta(days=7)
        ).count()
        logged_in_month = all_users.filter(
            last_login__gte=now - timedelta(days=30)
        ).count()
        
        # Security stats
        mfa_enabled = all_users.filter(mfa_enabled=True).count()
        password_expired = sum(1 for user in all_users if user.is_password_expired())
        unverified = all_users.filter(is_verified=False).count()
        
        # Recent registrations
        new_today = all_users.filter(
            date_joined__gte=now - timedelta(days=1)
        ).count()
        new_week = all_users.filter(
            date_joined__gte=now - timedelta(days=7)
        ).count()
        new_month = all_users.filter(
            date_joined__gte=now - timedelta(days=30)
        ).count()
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'activity_rate': round((active_users / total_users * 100), 1) if total_users > 0 else 0,
            
            'user_types': user_types,
            
            'login_activity': {
                'never_logged_in': never_logged_in,
                'logged_in_today': logged_in_today,
                'logged_in_week': logged_in_week,
                'logged_in_month': logged_in_month,
                'activity_rate_week': round((logged_in_week / total_users * 100), 1) if total_users > 0 else 0
            },
            
            'security': {
                'mfa_enabled': mfa_enabled,
                'mfa_adoption_rate': round((mfa_enabled / total_users * 100), 1) if total_users > 0 else 0,
                'password_expired': password_expired,
                'unverified_users': unverified
            },
            
            'registrations': {
                'new_today': new_today,
                'new_week': new_week,
                'new_month': new_month,
                'growth_rate_month': round((new_month / total_users * 100), 1) if total_users > 0 else 0
            }
        }


class AdminUserDetailView(generics.RetrieveAPIView):
    """
    Detailed view of a single user for admin
    """
    # required_permissions = 'user_view_all'
    permissions_classes = [IsAdminUser]
    queryset = User.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        """Get comprehensive user details"""
        user = self.get_object()
        
        # Get detailed login history
        login_history = user.login_history.order_by('-login_timestamp')[:50]
        login_data = []
        
        for login in login_history:
            login_data.append({
                'id': login.id,
                'timestamp': login.login_timestamp,
                'was_successful': login.was_successful,
                'failure_reason': login.failure_reason,
                'ip_address': login.ip_address,
                'user_agent': login.user_agent,
                'session_duration': login.session_duration
            })
        
        # Get role history (all assignments)
        role_history = UserRole.objects.filter(user=user).select_related(
            'role', 'assigned_by'
        ).order_by('-assigned_at')
        
        role_data = []
        for user_role in role_history:
            role_data.append({
                'id': user_role.id,
                'role': {
                    'id': user_role.role.id,
                    'name': user_role.role.name,
                    'description': user_role.role.description
                },
                'assigned_at': user_role.assigned_at,
                'assigned_by': {
                    'id': user_role.assigned_by.id if user_role.assigned_by else None,
                    'email': user_role.assigned_by.email if user_role.assigned_by else None,
                    'name': f"{user_role.assigned_by.first_name} {user_role.assigned_by.last_name}" if user_role.assigned_by else None
                },
                'is_active': user_role.is_active,
                'expires_at': user_role.expires_at,
                'is_expired': user_role.is_expired
            })
        
        # Get permission logs for this user (last 100)
        from .models import PermissionLog
        permission_logs = PermissionLog.objects.filter(
            user=user
        ).order_by('-timestamp')[:100]
        
        permission_data = []
        for log in permission_logs:
            permission_data.append({
                'id': log.id,
                'permission_codename': log.permission_codename,
                'action': log.action,
                'timestamp': log.timestamp,
                'ip_address': log.ip_address,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id
            })
        
        # Calculate comprehensive stats
        now = timezone.now()
        stats = {
            'login_stats': {
                'total_logins': user.login_history.filter(was_successful=True).count(),
                'failed_logins': user.login_history.filter(was_successful=False).count(),
                'unique_ips': user.login_history.values('ip_address').distinct().count(),
                'last_30_days_logins': user.login_history.filter(
                    was_successful=True,
                    login_timestamp__gte=now - timedelta(days=30)
                ).count()
            },
            'account_age_days': (now - user.date_joined).days,
            'days_since_last_login': (now - user.last_login).days if user.last_login else None,
            'total_roles_ever': role_history.count(),
            'active_roles_count': role_history.filter(is_active=True).count(),
            'permission_checks_30_days': permission_logs.filter(
                timestamp__gte=now - timedelta(days=30)
            ).count()
        }
        
        # Log admin access
        logger.info(
            f"Admin {request.user.email} viewed detailed info for user {user.email}",
            extra={
                'admin_id': request.user.id,
                'target_user_id': user.id,
                'action': 'user_detail_view'
            }
        )
        
        list_view = AdminUsersListView()
        user_data = list_view._serialize_users([user])[0]
        
        return Response({
            'user': user_data,
            'login_history': login_data,
            'role_history': role_data,
            'permission_logs': permission_data,
            'detailed_stats': stats
        })


class AdminUsersFiltersView(generics.GenericAPIView):
    """
    Get available filter options for the admin users list
    """
    # required_permissions = 'user_view_all'
    permissions_classes = [IsAdminUser]
    
    def get(self, request):
        """Get filter options"""
        from .models import Role
        
        # Get available roles
        roles = Role.objects.filter(is_active=True).values('id', 'name')
        
        # Get user types
        user_types = [{'code': choice[0], 'display': choice[1]} for choice in User.USER_TYPES]
        
        # Get status options
        status_options = [
            {'code': 'Active', 'display': 'Active (last 7 days)'},
            {'code': 'Recently Active', 'display': 'Recently Active (7-30 days)'},
            {'code': 'Dormant', 'display': 'Dormant (90+ days)'},
            {'code': 'Inactive', 'display': 'Inactive/Disabled'},
            {'code': 'Never Logged In', 'display': 'Never Logged In'}
        ]
        
        # Get sort options
        sort_options = [
            {'code': '-date_joined', 'display': 'Newest First'},
            {'code': 'date_joined', 'display': 'Oldest First'},
            {'code': 'email', 'display': 'Email A-Z'},
            {'code': '-email', 'display': 'Email Z-A'},
            {'code': 'first_name', 'display': 'First Name A-Z'},
            {'code': '-first_name', 'display': 'First Name Z-A'},
            {'code': '-last_login', 'display': 'Recently Active'},
            {'code': 'last_login', 'display': 'Least Active'}
        ]
        
        return Response({
            'roles': list(roles),
            'user_types': user_types,
            'status_options': status_options,
            'sort_options': sort_options,
            'boolean_filters': [
                {'code': 'is_active', 'display': 'Account Status', 'options': [
                    {'value': 'true', 'display': 'Active'},
                    {'value': 'false', 'display': 'Inactive'}
                ]},
                {'code': 'has_mfa', 'display': 'MFA Status', 'options': [
                    {'value': 'true', 'display': 'MFA Enabled'},
                    {'value': 'false', 'display': 'MFA Disabled'}
                ]}
            ]
        })


# Export current view
def get_view_permissions_summary():
    """Helper function to document all view permissions"""
    return {
        "UserProfileView": {
            "GET": ["IsAuthenticated", "RequireOwnerPermission('user_view_all')"],
            "PUT/PATCH": ["IsAuthenticated", "RequireOwnerPermission('user_edit_all')"],
            "description": "Users can view/edit own profile, admins can view/edit any profile"
        },
        "UserUpdateView": {
            "PUT/PATCH": ["IsAuthenticated", "RequireOwnerOrPermission('user_edit_all')"],
            "description": "Users can update own account, admins can update any account"
        },
        "LoginHistoryView": {
            "GET": ["IsAuthenticated", "RequireOwnerOrPermission('user_view_all') for other users"],
            "description": "Users can view own history, admins can view any user's history"
        },
        "MFASetupView": {
            "POST": ["IsAuthenticated"],
            "description": "Users can only setup MFA for themselves"
        },
        "MFASetupVerifyView": {
            "POST": ["IsAuthenticated"],
            "description": "Users can only verify their own MFA setup"
        },
        "MFAVerifyView": {
            "POST": ["AllowAny"],
            "description": "No auth needed - part of login flow"
        },
        "PasswordResetRequestView": {
            "POST": ["AllowAny"],
            "description": "No auth needed - password reset request"
        },
        "PasswordResetConfirmView": {
            "POST": ["AllowAny"],
            "description": "No auth needed - password reset confirmation"
        },
        "PasswordChangeView": {
            "POST": ["IsAuthenticated", "RequirePermission('user_edit_all') for other users"],
            "description": "Users can change own password, admins can change any password"
        },
        "PasswordChangeRequiredView": {
            "GET/POST": ["IsAuthenticated"],
            "description": "Handles forced password changes for expired passwords"
        },
        "AdminPasswordResetView": {
            "POST": ["IsAuthenticated", "RequirePermission('user_edit_all')"],
            "description": "Admin-only password reset for any user"
        },
        "UserAccountStatusView": {
            "POST": ["IsAuthenticated", "RequirePermission('user_edit_all')"],
            "description": "Admin-only account activation/deactivation"
        },
        "BulkUserActionsView": {
            "POST": ["IsAuthenticated", "RequirePermission('user_edit_all')"],
            "description": "Admin-only bulk user management actions"
        },
        "UserPermissionSummaryView": {
            "GET": ["IsAuthenticated", "RequirePermission('user_view_all') for other users"],
            "description": "Users can view own permissions, admins can view any user's permissions"
        },
        "MyPermissionsView": {
            "GET": ["IsAuthenticated"],
            "description": "Current user's permissions for frontend use"
        },
        "SecurityAuditView": {
            "GET": ["IsAuthenticated", "RequirePermission('view_audit_logs')"],
            "description": "Security audit information for admins/auditors"
        }
    }