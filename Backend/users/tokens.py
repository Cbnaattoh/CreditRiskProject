"""
Custom JWT token implementation for MFA flow control
"""
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class MFASetupToken(AccessToken):
    """
    Limited access token for users who need to complete MFA setup.
    This token only allows access to MFA setup endpoints.
    """
    token_type = 'mfa_setup'
    lifetime = api_settings.ACCESS_TOKEN_LIFETIME  # Same lifetime as regular access token
    
    @classmethod
    def for_user(cls, user):
        """
        Returns an MFA setup token for the given user that contains
        limited scope information.
        """
        token = cls()
        token.payload['user_id'] = user.pk
        token.payload['email'] = user.email
        token.payload['scope'] = 'mfa_setup'
        token.payload['requires_mfa_setup'] = True
        token.payload['mfa_setup_pending'] = getattr(user, 'mfa_setup_pending', False)
        
        return token


class MFASetupRefreshToken(RefreshToken):
    """
    Refresh token for MFA setup flow that generates MFASetupToken access tokens.
    """
    access_token_class = MFASetupToken
    
    @classmethod
    def for_user(cls, user):
        """
        Returns a refresh token for the given user with limited scope.
        """
        token = cls()
        token.payload['user_id'] = user.pk
        token.payload['email'] = user.email
        token.payload['scope'] = 'mfa_setup'
        token.payload['requires_mfa_setup'] = True
        
        return token


class FullAccessToken(AccessToken):
    """
    Full access token for users who have completed MFA (if required).
    This token allows access to all endpoints the user has permissions for.
    """
    token_type = 'access'
    
    @classmethod
    def for_user(cls, user):
        """
        Returns a full access token for the given user.
        """
        token = cls()
        token.payload['user_id'] = user.pk
        token.payload['email'] = user.email
        token.payload['scope'] = 'full_access'
        token.payload['mfa_completed'] = user.is_mfa_fully_configured if hasattr(user, 'is_mfa_fully_configured') else False
        token.payload['mfa_enabled'] = getattr(user, 'mfa_enabled', False)
        
        # Add user roles and permissions to token for faster permission checks
        if hasattr(user, 'get_roles'):
            token.payload['roles'] = [role.name for role in user.get_roles()]
        
        return token


class FullAccessRefreshToken(RefreshToken):
    """
    Full access refresh token that generates FullAccessToken access tokens.
    """
    access_token_class = FullAccessToken
    
    @classmethod
    def for_user(cls, user):
        """
        Returns a full access refresh token for the given user.
        """
        token = cls()
        token.payload['user_id'] = user.pk
        token.payload['email'] = user.email
        token.payload['scope'] = 'full_access'
        
        return token


def create_tokens_for_user(user):
    """
    Factory function to create appropriate tokens based on user's MFA status.
    
    Returns:
        dict: Contains 'access', 'refresh', and 'token_type' keys
    """
    try:
        # Check if user requires MFA setup
        if hasattr(user, 'requires_mfa_setup') and user.requires_mfa_setup:
            refresh = MFASetupRefreshToken.for_user(user)
            access = refresh.access_token
            
            logger.info(f"Created MFA setup tokens for user {user.email}")
            
            return {
                'access': str(access),
                'refresh': str(refresh),
                'token_type': 'mfa_setup',
                'requires_mfa_setup': True
            }
        
        # Check if user has MFA enabled but not completed
        elif (hasattr(user, 'mfa_enabled') and user.mfa_enabled and 
              hasattr(user, 'is_mfa_fully_configured') and not user.is_mfa_fully_configured):
            refresh = MFASetupRefreshToken.for_user(user)
            access = refresh.access_token
            
            logger.info(f"Created MFA setup tokens for user {user.email} (incomplete MFA)")
            
            return {
                'access': str(access),
                'refresh': str(refresh),
                'token_type': 'mfa_setup',
                'requires_mfa_setup': True
            }
        
        # User doesn't need MFA or has completed it - issue full access tokens
        else:
            refresh = FullAccessRefreshToken.for_user(user)
            access = refresh.access_token
            
            logger.info(f"Created full access tokens for user {user.email}")
            
            return {
                'access': str(access),
                'refresh': str(refresh),
                'token_type': 'full_access',
                'requires_mfa_setup': False
            }
            
    except Exception as e:
        logger.error(f"Error creating tokens for user {user.email}: {str(e)}")
        # Fallback to MFA setup tokens for security
        refresh = MFASetupRefreshToken.for_user(user)
        access = refresh.access_token
        
        return {
            'access': str(access),
            'refresh': str(refresh),
            'token_type': 'mfa_setup',
            'requires_mfa_setup': True
        }


def get_token_scope(token):
    """
    Extract scope from token payload.
    
    Args:
        token: JWT token instance or decoded payload
        
    Returns:
        str: Token scope ('mfa_setup' or 'full_access')
    """
    try:
        if hasattr(token, 'payload'):
            return token.payload.get('scope', 'full_access')
        elif isinstance(token, dict):
            return token.get('scope', 'full_access')
        else:
            return 'full_access'
    except Exception:
        return 'full_access'  # Default to full access for safety


def is_mfa_setup_token(token):
    """
    Check if token is an MFA setup token.
    
    Args:
        token: JWT token instance or decoded payload
        
    Returns:
        bool: True if token is for MFA setup
    """
    scope = get_token_scope(token)
    return scope == 'mfa_setup'