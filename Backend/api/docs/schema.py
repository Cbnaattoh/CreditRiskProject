from drf_spectacular.views import SpectacularAPIView
from api.docs.tags import API_TAGS

class CustomSchemaView(SpectacularAPIView):
    def get_tags(self):
        """
        Return tags with proper ordering
        """
        return API_TAGS

    def get_servers(self):
        """
        Override servers based on environment
        """
        if self.request.META.get('HTTP_HOST', '').startswith('localhost'):
            return [{'url': 'http://localhost:8000', 'description': 'Local development server'}]
        return super().get_servers()