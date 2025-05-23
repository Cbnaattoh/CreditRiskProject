from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice
from ..models import User, UserActivity
from ..serializers import (
    UserLoginSerializer,
    UserRegisterSerializer,
    TwoFactorVerifySerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer
)
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class UserLoginView(APIView):
    """
    Handles user authentication and login functionality.
    Supports both standard and 2FA authentication flows.
    """
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        remember_me = serializer.validated_data.get('remember_me', False)
        
        # Authenticate user
        user = authenticate(request, email=email, password=password)
        
        if not user:
            # Record failed login attempt
            try:
                user = User.objects.get(email=email)
                user.record_login_attempt(request.META.get('REMOTE_ADDR'), False)
            except User.DoesNotExist:
                pass
            
            logger.warning(f"Failed login attempt for email: {email}")
            return Response(
                {'detail': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if account is locked
        if user.is_locked:
            logger.warning(f"Locked account attempt: {email}")
            return Response(
                {'detail': 'Account is locked. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if 2FA is required
        if user.is_2fa_enabled:
            # Generate and send 2FA code (implementation depends on your 2FA method)
            device = devices_for_user(user, confirmed=True).first()
            if not device:
                return Response(
                    {'detail': '2FA device not configured'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # For TOTP, the frontend will handle code generation
            # For SMS/Email 2FA, you would send the code here
            request.session['2fa_user_id'] = user.id
            request.session['2fa_remember'] = remember_me
            
            logger.info(f"2FA required for user: {email}")
            return Response(
                {'detail': '2FA required', 'requires_2fa': True},
                status=status.HTTP_200_OK
            )
        
        # Standard login without 2FA
        login(request, user)
        
        # Set session expiry based on remember me
        if remember_me:
            request.session.set_expiry(settings.SESSION_COOKIE_AGE_REMEMBER)
        else:
            request.session.set_expiry(settings.SESSION_COOKIE_AGE)
        
        # Record successful login
        user.record_login_attempt(request.META.get('REMOTE_ADDR'), True)
        
        logger.info(f"User logged in: {email}")
        return Response(
            {'detail': 'Login successful'},
            status=status.HTTP_200_OK
        )

class TwoFactorVerifyView(APIView):
    """
    Handles two-factor authentication verification.
    """
    permission_classes = [AllowAny]
    serializer_class = TwoFactorVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = request.session.get('2fa_user_id')
        token = serializer.validated_data['token']
        remember_me = request.session.get('2fa_remember', False)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid session'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token
        device = devices_for_user(user, confirmed=True).first()
        if not device or not device.verify_token(token):
            logger.warning(f"Invalid 2FA token for user: {user.email}")
            return Response(
                {'detail': 'Invalid verification code'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Complete login
        login(request, user)
        
        # Set session expiry
        if remember_me:
            request.session.set_expiry(settings.SESSION_COOKIE_AGE_REMEMBER)
        else:
            request.session.set_expiry(settings.SESSION_COOKIE_AGE)
        
        # Clear 2FA session data
        if '2fa_user_id' in request.session:
            del request.session['2fa_user_id']
        if '2fa_remember' in request.session:
            del request.session['2fa_remember']
        
        # Record successful login
        user.record_login_attempt(request.META.get('REMOTE_ADDR'), True)
        
        logger.info(f"User logged in with 2FA: {user.email}")
        return Response(
            {'detail': '2FA verification successful'},
            status=status.HTTP_200_OK
        )

class UserLogoutView(APIView):
    """
    Handles user logout functionality.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Record logout activity
        UserActivity.objects.create(
            user=request.user,
            activity_type="LOGOUT",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        logout(request)
        logger.info(f"User logged out: {request.user.email}")
        return Response(
            {'detail': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )

class PasswordResetView(APIView):
    """
    Handles password reset requests.
    """
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether user exists
            return Response(
                {'detail': 'If this email exists in our system, you will receive a password reset link.'},
                status=status.HTTP_200_OK
            )
        
        # Generate and send password reset token
        # Implementation depends on your email service
        # Typically you would use Django's password reset tokens or JWT
        
        logger.info(f"Password reset requested for: {email}")
        return Response(
            {'detail': 'If this email exists in our system, you will receive a password reset link.'},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(APIView):
    """
    Handles password reset confirmation.
    """
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate token and reset password
        # Implementation depends on your token system
        
        logger.info("Password reset completed")
        return Response(
            {'detail': 'Password has been reset successfully'},
            status=status.HTTP_200_OK
        )