from django.urls import path
from .views import (
    RiskAssessmentView,
    DecisionView,
    CreditScoreListView,
    RiskExplanationView,
    CounterfactualView,
    RiskAnalysisView,
    ModelPredictionListView,
    CounterfactualListView,
    risk_analytics_dashboard,
    risk_charts_data
)

app_name = 'risk'

urlpatterns = [
    # Risk Analytics Dashboard endpoint
    path('analytics/dashboard/', risk_analytics_dashboard, name='risk-analytics-dashboard'),
    
    # Risk Charts Data endpoint
    path('analytics/charts/', risk_charts_data, name='risk-charts-data'),
    
    # Comprehensive risk analysis endpoint
    path('analysis/<uuid:pk>/', RiskAnalysisView.as_view(), name='risk-analysis'),

    # Risk assessment endpoints
    path('applications/<uuid:pk>/', RiskAssessmentView.as_view(), name='risk-assessment'),
    path('applications/<uuid:pk>/decision/', DecisionView.as_view(), name='decision-detail'),
    path('applications/<uuid:pk>/credit-scores/', CreditScoreListView.as_view(), name='credit-score-list'),

    # AI explanation endpoints
    path('applications/<uuid:pk>/explanations/', RiskExplanationView.as_view(), name='risk-explanation'),
    path('applications/<uuid:pk>/counterfactuals/', CounterfactualView.as_view(), name='counterfactuals'),

    # Model and counterfactual lists (filtered by query param)
    path('predictions/', ModelPredictionListView.as_view(), name='model-predictions-list'),
    path('counterfactuals/', CounterfactualListView.as_view(), name='counterfactuals-list'),
]
