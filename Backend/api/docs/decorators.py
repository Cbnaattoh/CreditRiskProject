from drf_spectacular.utils import extend_schema, OpenApiResponse
from api.docs.config import ERROR_RESPONSES
from rest_framework import status

def generic_api_documentation(summary=None, description=None, responses=None):
    """
    Decorator for class-based API views (like GenericAPIView)
    """
    def decorator(view_class):
        serializer_class = getattr(view_class, 'serializer_class', None)

        default_responses = {
            status.HTTP_200_OK: OpenApiResponse(
                description='Success',
                response=serializer_class
            ),
            **ERROR_RESPONSES
        }

        if responses:
            default_responses.update(responses)

        return extend_schema(
            summary=summary or view_class.__name__.replace('_', ' ').title(),
            description=description or getattr(view_class, '__doc__', ''),
            responses=default_responses,
            tags=[view_class.__module__.split('.')[0].title()]
        )(view_class)

    return decorator

def mfa_protected():
    """
    Decorator for endpoints requiring MFA verification
    """
    return extend_schema(
        security=[{'jwtAuth': [], 'mfaAuth': []}],
        responses={
            '403': {
                'description': 'MFA Required',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'detail': {'type': 'string'},
                                'requires_mfa': {'type': 'boolean'},
                                'temp_token': {'type': 'string'}
                            }
                        },
                        'example': {
                            'detail': 'MFA verification required',
                            'requires_mfa': True,
                            'temp_token': 'generated-temp-token'
                        }
                    }
                }
            }
        }
    )