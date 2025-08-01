from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken, AccessToken
from .tokens import MFASetupToken, FullAccessToken
import logging

logger = logging.getLogger(__name__)


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that supports multiple token types including
    MFASetupToken and FullAccessToken.
    """
    
    def get_validated_token(self, raw_token):
        """
        Validates the given raw token and returns a validated token instance.
        Tries multiple token types to find the correct one.
        """
        # List of token classes to try, in order of preference
        token_classes = [
            FullAccessToken,    # Try full access tokens first
            MFASetupToken,      # Then MFA setup tokens
            AccessToken,        # Finally, standard access tokens
        ]
        
        last_exception = None
        
        for token_class in token_classes:
            try:
                # Attempt to validate the token with this class
                validated_token = token_class(raw_token)
                
                # Log successful token validation
                token_type = getattr(validated_token, 'token_type', token_class.__name__)
                logger.debug(f"Successfully validated token as {token_type}")
                
                return validated_token
                
            except TokenError as e:
                # Store the last exception for potential error reporting
                last_exception = e
                continue
        
        # If none of the token classes worked, raise the last exception
        if last_exception:
            logger.warning(f"Token validation failed for all token types: {str(last_exception)}")
            raise InvalidToken(last_exception.args[0]) from last_exception
        
        # This shouldn't happen, but just in case
        raise InvalidToken("Token validation failed")

    def get_user(self, validated_token):
        """
        Get the user associated to the token and add token type information.
        """
        user = super().get_user(validated_token)
        
        # Add token type information to the user object for middleware/permissions
        if hasattr(validated_token, 'token_type'):
            user._token_type = validated_token.token_type
        elif hasattr(validated_token, 'payload'):
            # Check payload for scope information
            scope = validated_token.payload.get('scope', 'access')
            user._token_type = scope
        else:
            user._token_type = 'access'  # Default
            
        logger.debug(f"User {user.email} authenticated with token type: {user._token_type}")
        
        return user