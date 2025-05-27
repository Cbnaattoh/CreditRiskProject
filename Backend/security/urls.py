from django.urls import path
from .views import SubmitBehavioralDataView

app_name = 'security'

urlpatterns = [
    path('submit-behavior/', SubmitBehavioralDataView.as_view(), name='submit-behavior'),
]
