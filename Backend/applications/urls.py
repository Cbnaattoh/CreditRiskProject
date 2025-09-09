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
    # New review and tracking views
    ApplicationReviewListView,
    ApplicationReviewDetailView,
    ApplicationStatusHistoryView,
    ApplicationActivityView,
    ApplicationCommentListView,
    start_review,
    complete_review,
    application_dashboard,
    verify_document,
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
    
    # Application Review Management
    path('reviews/', ApplicationReviewListView.as_view(), name='review-list'),
    path('<uuid:pk>/reviews/', ApplicationReviewListView.as_view(), name='application-reviews'),
    path('reviews/<int:pk>/', ApplicationReviewDetailView.as_view(), name='review-detail'),
    path('<uuid:pk>/start-review/', start_review, name='start-review'),
    path('<uuid:pk>/complete-review/', complete_review, name='complete-review'),
    
    # Application Status and Activity Tracking
    path('<uuid:pk>/status-history/', ApplicationStatusHistoryView.as_view(), name='status-history'),
    path('<uuid:pk>/activities/', ApplicationActivityView.as_view(), name='activities'),
    
    # Application Comments/Communication
    path('<uuid:pk>/comments/', ApplicationCommentListView.as_view(), name='comments'),
    
    # Document Verification
    path('<uuid:application_pk>/documents/<int:document_pk>/verify/', verify_document, name='verify-document'),
    
    # Risk Analyst Dashboard
    path('dashboard/', application_dashboard, name='dashboard'),
]