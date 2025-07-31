from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    # Authentication endpoints
    path('auth/', include('users.urls.auth')),
    
    # Token refresh endpoint
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Application endpoints
    path('applications/', include('applications.urls')),
    
    # Risk assessment endpoints
    path('risk/', include('risk.urls')),
    
    # Document processing endpoints
    path('documents/', include('documents.urls')),
    
    # User management endpoints
    path('users/', include('users.urls.user')),
    
    # AI services endpoints
    path('ai/', include('ai.urls')),
    
    # Integration endpoints
    # path('integrations/', include('integrations.urls')),
    
    # Security endpoints
    path('security/', include('security.urls')),
    
    # Reports endpoints
    path('reports/', include('reports.urls')),

]
