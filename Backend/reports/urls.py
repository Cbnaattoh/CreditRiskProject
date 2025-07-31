from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

from .views import (
    ReportViewSet, ReportTemplateViewSet, ReportScheduleViewSet,
    ReportKPIViewSet, ReportAnalyticsView, ReportCommentViewSet
)

# Main router
router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'templates', ReportTemplateViewSet, basename='reporttemplate')
router.register(r'schedules', ReportScheduleViewSet, basename='reportschedule')
router.register(r'kpis', ReportKPIViewSet, basename='reportkpi')
router.register(r'analytics', ReportAnalyticsView, basename='reportanalytics')

# Nested router for report comments
reports_router = NestedDefaultRouter(router, r'reports', lookup='report')
reports_router.register(r'comments', ReportCommentViewSet, basename='report-comments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(reports_router.urls)),
]