from django.urls import path
from .views import (
    ApplicationListView,
    ApplicationDetailView,
    ApplicationSubmitView,
    DocumentListView,
    DocumentDetailView,
    ApplicationNoteListView,
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
]