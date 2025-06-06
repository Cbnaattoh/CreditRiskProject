from drf_spectacular.utils import extend_schema
from users.serializers import UserProfileSerializer
from api.docs.config import ERROR_RESPONSES


# --- UserProfileView GET/PUT/PATCH ---

get_user_profile_docs = extend_schema(
    summary="Get User Profile",
    description="Retrieve the authenticated user's profile information.",
    responses={
        200: UserProfileSerializer,
        **ERROR_RESPONSES
    }
)

update_user_profile_docs = extend_schema(
    summary="Update User Profile",
    description="Update the authenticated user's profile information.",
    request=UserProfileSerializer,
    responses={
        200: UserProfileSerializer,
        **ERROR_RESPONSES
    }
)

partial_update_user_profile_docs = extend_schema(
    summary="Partial Update User Profile",
    description="Partially update the authenticated user's profile information.",
    request=UserProfileSerializer,
    responses={
        200: UserProfileSerializer,
        **ERROR_RESPONSES
    }
)
