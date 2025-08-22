from django.urls import path, include
from ..views import (
    UserProfileView,
    LoginHistoryView,
    UserUpdateView,
    AdminPasswordResetView,
    UserAccountStatusView,
    BulkUserActionsView,
    MyPermissionsView,
    UserPermissionSummaryView,
    SecurityAuditView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminUsersFiltersView,
    AdminUserCreationView
)

app_name = 'users'

urlpatterns = [
    # User Profile Management
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('me/profile/<int:pk>/', UserProfileView.as_view(), name='user-profile-detail'),
    path('me/update/', UserUpdateView.as_view(), name='user-update'),
    path('me/update/<int:pk>/', UserUpdateView.as_view(), name='user-update-detail'),

    # User Login History
    path('me/login-history/', LoginHistoryView.as_view(), name='user-login-history'),
    path('me/login-history/<int:user_id>/', LoginHistoryView.as_view(), name='user-login-history-detail'),

    # Admin-only User Management
    path('admin/create-user/', AdminUserCreationView.as_view(), name='admin-create-user'),
    path('admin/password-reset/<int:user_id>/', AdminPasswordResetView.as_view(), name='admin-password-reset'),
    path('admin/account-status/<int:user_id>/', UserAccountStatusView.as_view(), name='admin-account-status'),
    path('admin/bulk-actions/', BulkUserActionsView.as_view(), name='admin-bulk-actions'),
    path('admin/users/list/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('admin/users/<int:user_id>/detail/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/filters/', AdminUsersFiltersView.as_view(), name='admin-users-filters'),

    # Utility Endpoints
    path('me/permissions/', MyPermissionsView.as_view(), name='my-permissions'),
    path('me/permissions/summary/', UserPermissionSummaryView.as_view(), name='user-permission-summary'),
    path('me/permissions/<int:user_id>/', UserPermissionSummaryView.as_view(), name='user-permissions-summary'),

    # Security and Monitoring
    path('security-audit/', SecurityAuditView.as_view(), name='security-audit'),
    
    # Advanced Settings Management
    path('settings/', include('users.urls.settings'), name='settings'),
]