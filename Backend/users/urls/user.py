from django.urls import path
from ..views import (
    UserProfileView,
    LoginHistoryView,
    UserUpdateView
)

app_name = 'users'

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('me/update/', UserUpdateView.as_view(), name='user-update'),
    path('me/login-history/', LoginHistoryView.as_view(), name='user-login-history'),
]