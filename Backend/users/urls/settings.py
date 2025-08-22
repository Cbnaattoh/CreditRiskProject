from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..settings_views import (
    UserPreferencesViewSet,
    UserSessionViewSet,
    SecurityEventViewSet,
    SettingsOverviewViewSet
)

router = DefaultRouter()
router.register(r'preferences', UserPreferencesViewSet, basename='preferences')
router.register(r'sessions', UserSessionViewSet, basename='sessions')
router.register(r'security-events', SecurityEventViewSet, basename='security-events')
router.register(r'overview', SettingsOverviewViewSet, basename='overview')

app_name = 'settings'

urlpatterns = [
    path('', include(router.urls)),
]