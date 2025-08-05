from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BehavioralBiometricsViewSet, SuspiciousActivityViewSet,
    SecurityDashboardView, SecurityAlertsView, SubmitBehavioralDataView
)

# Create router for ViewSets
router = DefaultRouter()
router.register('behavioral-biometrics', BehavioralBiometricsViewSet, basename='behavioral-biometrics')
router.register('suspicious-activities', SuspiciousActivityViewSet, basename='suspicious-activities')

app_name = 'security'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Dashboard and monitoring endpoints
    path('dashboard/stats/', SecurityDashboardView.as_view(), name='dashboard-stats'),
    path('alerts/', SecurityAlertsView.as_view(), name='security-alerts'),
    
    # Behavioral data submission
    path('behavioral-data/submit/', SubmitBehavioralDataView.as_view(), name='submit-behavioral-data'),
    
    # Legacy endpoint (keep for backward compatibility)
    path('submit-behavior/', SubmitBehavioralDataView.as_view(), name='submit-behavior'),
]
