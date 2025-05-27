from django.urls import path
from .views import (
    DocumentUploadView,
    DocumentAnalyzeView,
    OCRResultView
)

app_name = 'documents'

urlpatterns = [
    path('applications/<uuid:application_id>/', DocumentUploadView.as_view(), name='upload'),
    path('<uuid:document_id>/analyze/', DocumentAnalyzeView.as_view(), name='analyze'),
    path('<uuid:document_id>/ocr/', OCRResultView.as_view(), name='ocr'),
]