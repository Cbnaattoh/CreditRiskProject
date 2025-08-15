from django.urls import path
from .views import (
    ApplicationListView,
    ApplicationDetailView,
    ApplicationSubmitView,
    DocumentListView,
    DocumentDetailView,
    ApplicationNoteListView,
    predict_credit_score,
    ml_model_health,
    trigger_ml_assessment,
    batch_trigger_ml_assessments,
    ml_assessment_status,
    ml_processing_statistics,
    get_user_ml_assessments,
)

app_name = 'applications'

urlpatterns = [
    # Application management
    path('', ApplicationListView.as_view(), name='list'),
    path('<uuid:pk>/', ApplicationDetailView.as_view(), name='detail'),
    path('<uuid:pk>/submit/', ApplicationSubmitView.as_view(), name='submit'),
    
    # Application documents
    path('<uuid:pk>/documents/', DocumentListView.as_view(), name='document-list'),
    path('<uuid:pk>/documents/<uuid:doc_pk>/', DocumentDetailView.as_view(), name='document-detail'),
    
    # Application notes
    path('<uuid:pk>/notes/', ApplicationNoteListView.as_view(), name='notes'),
    
    # ML Credit Scoring
    path('<uuid:pk>/predict-credit-score/', predict_credit_score, name='predict-credit-score'),
    path('ml-model/health/', ml_model_health, name='ml-model-health'),
    
    # ML Assessment Management
    path('<uuid:pk>/ml-assessment/trigger/', trigger_ml_assessment, name='trigger-ml-assessment'),
    path('<uuid:pk>/ml-assessment/', ml_assessment_status, name='ml-assessment-status'),
    path('ml-assessments/batch-trigger/', batch_trigger_ml_assessments, name='batch-trigger-ml-assessments'),
    path('ml-assessments/statistics/', ml_processing_statistics, name='ml-processing-statistics'),
    path('my-ml-assessments/', get_user_ml_assessments, name='user-ml-assessments'),
]