from django.urls import path
from .views import (
    AIModelVersionListCreateView,
    AIModelVersionDetailView,
    ModelTrainingLogListCreateView,
    ModelTrainingLogDetailView,
    FeatureImportanceListCreateView,
    FeatureImportanceDetailView
)

app_name = 'ai'

urlpatterns = [
    # AI Model Versions
    path('models/', AIModelVersionListCreateView.as_view(), name='model-list-create'),
    path('models/<uuid:pk>/', AIModelVersionDetailView.as_view(), name='model-detail'),

    # Model Training Logs
    path('models/<uuid:pk>/training-logs/', ModelTrainingLogListCreateView.as_view(), name='training-log-list-create'),
    path('models/<uuid:pk>/training-logs/<int:log_pk>/', ModelTrainingLogDetailView.as_view(), name='training-log-detail'),

    # Feature Importances
    path('models/<uuid:pk>/features/', FeatureImportanceListCreateView.as_view(), name='feature-list-create'),
    path('models/<uuid:pk>/features/<int:feature_pk>/', FeatureImportanceDetailView.as_view(), name='feature-detail'),
]
