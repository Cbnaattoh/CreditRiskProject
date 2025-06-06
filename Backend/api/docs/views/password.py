from drf_spectacular.utils import extend_schema, OpenApiExample
from users.serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from api.docs.config import ERROR_RESPONSES

password_reset_request_docs = extend_schema(
    summary="Request Password Reset",
    description="Request a password reset link. The response is always 200 to prevent email enumeration.",
    request=PasswordResetRequestSerializer,
    responses={
        200: {
            'description': 'Password reset link sent (if account exists)',
            'content': {
                'application/json': {
                    'example': {
                        'detail': 'If an account exists with this email, a password reset link has been sent.'
                    }
                }
            }
        },
        **ERROR_RESPONSES
    },
    examples=[
        OpenApiExample(
            'Reset Request',
            value={'email': 'user@example.com'},
            request_only=True
        )
    ]
)

password_reset_confirm_docs = extend_schema(
    summary="Confirm Password Reset",
    description="Confirm a password reset using the UID and token sent via email.",
    request=PasswordResetConfirmSerializer,
    responses={
        200: {
            'description': 'Password reset successful',
            'content': {
                'application/json': {
                    'example': {'detail': 'Password has been reset successfully.'}
                }
            }
        },
        400: {
            'description': 'Invalid or expired token',
            'content': {
                'application/json': {
                    'example': {'detail': 'Invalid reset link.'}
                }
            }
        },
        **ERROR_RESPONSES
    },
    examples=[
        OpenApiExample(
            'Password Reset Confirm',
            value={
                'uid': 'encoded-uid',
                'token': 'reset-token',
                'new_password': 'NewStrongPassword123',
                'confirm_password': 'NewStrongPassword123'
            },
            request_only=True
        )
    ]
)

password_change_required_get_docs = extend_schema(
    summary="Password Change Required (GET)",
    description="Notify the user that their password has expired and must be changed.",
    responses={
        403: {
            'description': 'Password change required',
            'content': {
                'application/json': {
                    'example': {'detail': 'Your password has expired and must be changed'}
                }
            }
        },
        **ERROR_RESPONSES
    }
)

password_change_required_post_docs = extend_schema(
    summary="Change Expired Password",
    description="Allows user to change their expired password to a new one.",
    request=PasswordResetConfirmSerializer,
    responses={
        200: {
            'description': 'Password changed successfully',
            'content': {
                'application/json': {
                    'example': {'detail': 'Password changed successfully'}
                }
            }
        },
        **ERROR_RESPONSES
    },
    examples=[
        OpenApiExample(
            'Expired Password Change',
            value={
                'uid': 'ignored-or-null',
                'token': 'ignored-or-null',
                'new_password': 'NewPass123!',
                'confirm_password': 'NewPass123!'
            },
            request_only=True
        )
    ]
)
