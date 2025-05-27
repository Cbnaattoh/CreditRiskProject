from django.urls import path
from ..views import (
    LoginView,
    RegisterView,
    MFASetupView,
    MFAVerifyView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PasswordChangeRequiredView
)

app_name = 'auth'

urlpatterns = [
    path('login/', LoginView.as_view(), name='api-login'),
    path('register/', RegisterView.as_view(), name='api-register'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa-verify'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-change-required/', PasswordChangeRequiredView.as_view(), name='password_change_required'),
]
