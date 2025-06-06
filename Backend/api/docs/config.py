from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.plumbing import build_bearer_security_scheme_object
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiExample

class JWTScheme(OpenApiAuthenticationExtension):
    target_class = 'rest_framework_simplejwt.authentication.JWTAuthentication'
    name = 'jwtAuth'
    
    def get_security_definition(self, auto_schema):
        return build_bearer_security_scheme_object(
            header_name='Authorization',
            token_prefix='Bearer',
            bearer_format='JWT'
        )

class MFAScheme(OpenApiAuthenticationExtension):
    target_class = 'users.views.MFAVerifyView'
    name = 'mfaAuth'
    
    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'header',
            'name': 'X-MFA-Token',
            'description': 'MFA Verification Token (from authenticator app)'
        }

# Standard error responses
ERROR_RESPONSES = {
    '400': {
        'description': 'Bad Request',
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'},
                        'code': {'type': 'string'},
                        'errors': {'type': 'object'}
                    }
                },
                'examples': {
                    'validation_error': {
                        'value': {
                            'detail': 'Validation error',
                            'errors': {
                                'field1': ['Error message']
                            }
                        }
                    }
                }
            }
        }
    },
    '401': {
        'description': 'Unauthorized',
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'}
                    }
                },
                'examples': {
                    'invalid_credentials': {
                        'value': {'detail': 'Invalid email or password'}
                    },
                    'invalid_token': {
                        'value': {'detail': 'Token is invalid or expired'}
                    }
                }
            }
        }
    },
    '403': {
        'description': 'Forbidden',
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'}
                    }
                }
            }
        }
    },
    '404': {
        'description': 'Not Found',
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'}
                    }
                }
            }
        }
    },
    '429': {
        'description': 'Too Many Requests',
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'},
                        'wait_time': {'type': 'integer'}
                    }
                }
            }
        }
    },
    '500': {
        'description': 'Internal Server Error',
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'detail': {'type': 'string'}
                    }
                }
            }
        }
    }
}