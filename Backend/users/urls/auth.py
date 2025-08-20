from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import (
    LoginView,
    RegisterView,
    MFASetupView,
    MFASetupVerifyView,
    MFAVerifyView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PasswordChangeRequiredView,
    PasswordChangeView,
    PermissionViewSet,
    RoleViewSet,
    UserRoleViewSet,
    UserManagementViewSet,
    PermissionLogViewSet,
    RBACDashboardView
)
from ..progressive_validation import (
    validate_step1_basic_info,
    validate_step2_identity,
    process_ghana_card_ocr,
    validate_step4_security,
    send_verification_code,
    verify_code
)

app_name = 'auth'

# RBAC Router
rbac_router = DefaultRouter()
rbac_router.register(r'permissions', PermissionViewSet, basename='permission')
rbac_router.register(r'roles', RoleViewSet, basename='role')
rbac_router.register(r'users-roles', UserRoleViewSet, basename='user-role')
rbac_router.register(r'users', UserManagementViewSet, basename='user-management')
rbac_router.register(r'audit-logs', PermissionLogViewSet, basename='audit-log')

urlpatterns = [
    # RBAC Management
    path('rbac/', include(rbac_router.urls)),
    path('rbac/dashboard/', RBACDashboardView.as_view(), name='rbac-dashboard'),

    # Authentication Management
    path('login/', LoginView.as_view(), name='api-login'),
    path('register/', RegisterView.as_view(), name='api-register'),

    # MFA Management
    path('mfa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/setup/verify/', MFASetupVerifyView.as_view(), name='mfa-setup-verify'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa-verify'),

    # Password Management
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password-change/',PasswordChangeView.as_view(), name='password_change'),
    path('password-change/<int:user_id>/', PasswordChangeView.as_view(), name='admin-password-change'),
    path('password-change-required/', PasswordChangeRequiredView.as_view(), name='password-change-required'),
    
    # Progressive Registration Validation
    path('register/validate/step1/', validate_step1_basic_info, name='validate-step1'),
    path('register/validate/step2/', validate_step2_identity, name='validate-step2'),
    path('register/validate/ghana-card/', process_ghana_card_ocr, name='validate-ghana-card'),
    path('register/validate/step4/', validate_step4_security, name='validate-step4'),
    path('register/verification/send/', send_verification_code, name='send-verification'),
    path('register/verification/verify/', verify_code, name='verify-code'),
]
