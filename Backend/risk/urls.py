from django.urls import path
from .views import (
    RiskAssessmentView,
    # RiskModelListView,
    DecisionView,
    CreditScoreListView,
    RiskExplanationView,
    CounterfactualView
)

app_name = 'risk'

urlpatterns = [
    # Risk assessment endpoints
    path('applications/<uuid:pk>/', RiskAssessmentView.as_view(), name='risk-assessment'),
    path('applications/<uuid:pk>/decision/', DecisionView.as_view(), name='decision-detail'),
    path('applications/<uuid:pk>/credit-scores/', CreditScoreListView.as_view(), name='credit-score-list'),
    
    # AI explanation endpoints
    path('applications/<uuid:pk>/explanations/', RiskExplanationView.as_view(), name='risk-explanation'),
    path('applications/<uuid:pk>/counterfactuals/', CounterfactualView.as_view(), name='counterfactuals'),
    
    # Model management endpoints
    # path('models/', RiskModelListView.as_view(), name='risk-model-list'),
]