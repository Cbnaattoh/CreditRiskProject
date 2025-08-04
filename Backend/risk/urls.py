from django.urls import path
from .views import (
    RiskAssessmentView,
    # RiskModelListView,
    DecisionView,
    CreditScoreListView,
    RiskExplanationView,
    CounterfactualView,
    RiskAnalysisView,
    ModelPredictionListView,
    CounterfactualListView
)

app_name = 'risk'

urlpatterns = [
    # Comprehensive risk analysis endpoint (matches frontend expectation)
    path('analysis/<uuid:pk>/', RiskAnalysisView.as_view(), name='risk-analysis'),
    
    # Direct endpoints for frontend API calls
    path('assessments/<uuid:pk>/', RiskAssessmentView.as_view(), name='direct-risk-assessment'),
    path('explanations/<uuid:pk>/', RiskExplanationView.as_view(), name='direct-risk-explanation'),
    path('predictions/', ModelPredictionListView.as_view(), name='model-predictions-list'),
    path('counterfactuals/', CounterfactualListView.as_view(), name='counterfactuals-list'),
    
    # Risk assessment endpoints
    path('applications/<uuid:pk>/', RiskAssessmentView.as_view(), name='risk-assessment'),
    path('applications/<uuid:pk>/decision/', DecisionView.as_view(), name='decision-detail'),
    path('applications/<uuid:pk>/credit-scores/', CreditScoreListView.as_view(), name='credit-score-list'),
    
    # AI explanation endpoints (legacy paths)
    path('applications/<uuid:pk>/explanations/', RiskExplanationView.as_view(), name='risk-explanation'),
    path('applications/<uuid:pk>/counterfactuals/', CounterfactualView.as_view(), name='counterfactuals'),
    
    # Model management endpoints
    # path('models/', RiskModelListView.as_view(), name='risk-model-list'),
]