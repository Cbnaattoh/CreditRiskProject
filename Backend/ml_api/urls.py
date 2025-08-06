from django.urls import path
from .views import (
    predict_credit_score,
    batch_predict_credit_scores,
    model_health_check,
    model_documentation
)

app_name = 'ml_api'

urlpatterns = [
    # Single prediction endpoint
    path('predict/', predict_credit_score, name='predict'),
    
    # Batch prediction endpoint  
    path('batch-predict/', batch_predict_credit_scores, name='batch-predict'),
    
    # Model health check
    path('health/', model_health_check, name='health'),
    
    # API documentation (public endpoint)
    path('docs/', model_documentation, name='docs'),
]