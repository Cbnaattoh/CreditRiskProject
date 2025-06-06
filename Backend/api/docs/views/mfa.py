from users.serializers import MFAVerifySerializer
from drf_spectacular.utils import extend_schema, OpenApiExample
from api.docs.config import ERROR_RESPONSES
from api.docs.decorators import generic_api_documentation, mfa_protected

# --- MFA Setup POST ---
mfa_setup_docs = generic_api_documentation(
    summary="Configure MFA",
    description="""
    Enable or disable Multi-Factor Authentication (MFA) for the authenticated user.
    When enabling, returns a provisioning URI and backup codes.
    """
)

# --- MFA Verify POST ---
mfa_verify_docs = extend_schema(
    summary="Verify MFA Token",
    description="Verify a one-time MFA token during login.",
    request=MFAVerifySerializer,
    responses={
        200: {
            'description': 'MFA verification successful',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'access': {'type': 'string'},
                            'refresh': {'type': 'string'},
                            'mfa_enabled': {'type': 'boolean'},
                            'is_verified': {'type': 'boolean'}
                        },
                        'example': {
                            'access': 'eyJhbGciOi...',
                            'refresh': 'eyJhbGciOi...',
                            'mfa_enabled': True,
                            'is_verified': True
                        }
                    }
                }
            }
        },
        **ERROR_RESPONSES
    },
    examples=[
        OpenApiExample(
            'MFA Verification Request',
            value={
                'uid': 'base64-encoded-user-id',
                'temp_token': 'temporary-token-from-login',
                'token': '123456'
            },
            request_only=True
        )
    ]
)