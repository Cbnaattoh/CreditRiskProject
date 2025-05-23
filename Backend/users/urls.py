from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views.auth import (
    UserLoginView,
    UserLogoutView,
    TwoFactorVerifyView,
    PasswordResetView,
    PasswordResetConfirmView
)
from .views.user import (
    UserRegisterView,
    UserProfileView,
    UserPasswordChangeView,
    TwoFactorSetupView,
    NotificationListView,
    NotificationMarkAsReadView
)

urlpatterns = [
    # Authentication endpoints
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    
    # Password management
    path('password/reset/', PasswordResetView.as_view(), name='password-reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password/change/', UserPasswordChangeView.as_view(), name='password-change'),
    
    # User management
    path('register/', UserRegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # 2FA management
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    
    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', NotificationMarkAsReadView.as_view(), name='notification-read'),
    
    # Token refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]