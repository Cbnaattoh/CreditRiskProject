from drf_spectacular.utils import OpenApiExample, extend_schema
from users.serializers import CustomTokenObtainPairSerializer, UserRegisterSerializer, LoginHistorySerializer
from api.docs.config import ERROR_RESPONSES


# --- LoginView POST ---
login_docs = extend_schema(
    summary="User Login",
    description="Authenticate user and obtain JWT tokens. May require MFA.",
    request=CustomTokenObtainPairSerializer,
    responses={
        200: {
            'description': 'Authentication successful',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'access': {'type': 'string'},
                            'refresh': {'type': 'string'},
                            'requires_mfa': {'type': 'boolean'},
                            'temp_token': {'type': 'string'}
                        },
                        'example': {
                            'access': 'eyJhbGciOi...',
                            'refresh': 'eyJhbGciOi...',
                            'requires_mfa': False,
                            'temp_token': None
                        }
                    }
                }
            }
        },
        **ERROR_RESPONSES
    },
    examples=[
        OpenApiExample(
            'Valid Credentials',
            value={'email': 'user@example.com', 'password': 'securepassword123'},
            request_only=True
        ),
        OpenApiExample(
            'MFA Required Response',
            value={
                'requires_mfa': True,
                'temp_token': 'generated-temp-token',
                'access': None,
                'refresh': 'eyJhbGciOi...'
            },
            response_only=True,
            status_codes=['200']
        )
    ]
)

# --- RegisterView POST ---
register_docs = extend_schema(
    summary="Register New User",
    description="Creates a new user account with the provided details.",
    request=UserRegisterSerializer,
    responses={
        201: {
            'description': 'User created successfully',
            'content': {
                'application/json': {
                    'schema': UserRegisterSerializer,
                    'examples': {
                        'success': {
                            'value': {
                                'email': 'user@example.com',
                                'first_name': 'John',
                                'last_name': 'Doe',
                                'message': 'User registered successfully'
                            }
                        }
                    }
                }
            }
        },
        **ERROR_RESPONSES
    },
    examples=[
        OpenApiExample(
            'Registration Request',
            value={
                'email': 'user@example.com',
                'password': 'securepassword123',
                'first_name': 'John',
                'last_name': 'Doe'
            },
            request_only=True
        )
    ]
)



# --- LoginHistoryView GET ---

login_history_docs = extend_schema(
    summary="Retrieve Login History",
    description="""
    Returns the last 20 login attempts of the currently authenticated user, sorted by most recent.
    
    Each entry includes:
    - IP address
    - User agent
    - Login time
    - Logout time (if applicable)
    - Whether the login was successful
    """,
    responses={
        200: LoginHistorySerializer(many=True),
        **ERROR_RESPONSES
    }
)

