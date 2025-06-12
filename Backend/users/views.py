from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ValidationError
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import LoginHistory, UserProfile
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.throttling import AnonRateThrottle,UserRateThrottle
from django.conf import settings
from django.db import transaction
from django.core.cache import cache
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    LoginHistorySerializer,
    MFASetupSerializer,
    MFAVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserRegisterSerializer,
    PasswordChangeSerializer,
    UserUpdateSerializer
)
from api.docs.views.password import (
    password_reset_confirm_docs,
    password_change_required_get_docs,
    password_change_required_post_docs,
    password_reset_request_docs
)
from api.docs.views.auth import login_docs, register_docs, login_history_docs
from api.docs.views.users import get_user_profile_docs, update_user_profile_docs, partial_update_user_profile_docs
from api.docs.views.mfa import mfa_setup_docs, mfa_verify_docs
from users.utils.mfa import generate_backup_codes, verify_backup_code
from .utils.email import send_password_reset_email, send_welcome_email
import pyotp
import logging
import json
from datetime import timedelta

logger = logging.getLogger(__name__)
User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    rate = '10/min'


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginThrottle]

    @login_docs
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        
        if not email or not password:
            return Response(
                {"detail": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for account lockout
        if self._is_account_locked(email):
            return Response(
                {"detail": "Account temporarily locked due to multiple failed attempts"},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            user = User.objects.select_related('profile').get(email=email)
            
            # Check if account is active
            if not user.is_active:
                self._log_failed_attempt(email, request, 'Account inactive')
                return Response(
                    {"detail": "Account is inactive"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                self._handle_successful_login(user, request)
                
                # Check for password expiration
                if user.is_password_expired():
                    response.data.update({
                        'requires_password_change': True,
                        'password_expired': True
                    })
                
                # Handle MFA if enabled
                if user.mfa_enabled:
                    return self._handle_mfa_required(user, response)
                    
                # Clear failed attempts on successful login
                self._clear_failed_attempts(email)
                
            return response
            
        except User.DoesNotExist:
            self._log_failed_attempt(email, request, 'User not found')
            return Response(
                {"detail": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"Login error for {email}: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Login failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _handle_successful_login(self, user, request):
        """Handle successful login logging and session management"""
        try:
            with transaction.atomic():
                LoginHistory.objects.create(
                    user=user,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                    was_successful=True
                )
                
                # Update last login
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
                
                logger.info(f"Successful login: {user.email} from IP: {self._get_client_ip(request)}")
        except Exception as e:
            logger.error(f"Error logging successful login: {str(e)}")

    def _handle_mfa_required(self, user, response):
        """Handle MFA requirement for login"""
        temp_token = default_token_generator.make_token(user)
        uid_encoded = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Store temp token in cache with expiration
        cache_key = f"mfa_temp_token:{user.id}"
        cache.set(cache_key, temp_token, timeout=300)  # 5 minutes
        
        response.data.update({
            'requires_mfa': True,
            'temp_token': temp_token,
            'uid': uid_encoded,
            'access': None,  # Don't provide access token until MFA is verified
            'refresh': None
        })
        return response

    def _is_account_locked(self, email):
        """Check if account is locked due to failed attempts"""
        cache_key = f"failed_attempts:{email}"
        attempts = cache.get(cache_key, 0)
        return attempts >= getattr(settings, 'MAX_LOGIN_ATTEMPTS', 5)

    def _log_failed_attempt(self, email, request, reason):
        """Log failed login attempt"""
        cache_key = f"failed_attempts:{email}"
        attempts = cache.get(cache_key, 0) + 1
        cache.set(cache_key, attempts, timeout=3600)  # 1 hour lockout
        
        # Log to database if user exists
        try:
            user = User.objects.get(email=email)
            LoginHistory.objects.create(
                user=user,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                was_successful=False
            )
        except User.DoesNotExist:
            pass
            
        logger.warning(f"Failed login attempt: {email} from IP: {self._get_client_ip(request)} - {reason}")

    def _clear_failed_attempts(self, email):
        """Clear failed login attempts"""
        cache_key = f"failed_attempts:{email}"
        cache.delete(cache_key)

    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        return ip



class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    @register_docs
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data.get('email', '').lower()

        # Double-check for existing user
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "User with this email already exists"},
                status=status.HTTP_409_CONFLICT
            )
        
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # Send welcome email
                try:
                    send_welcome_email(user)
                except Exception as e:
                    logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
                
                logger.info(f"New user registered: {user.email}")
                
                # Return user data without sensitive information
                return Response({
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                    'is_verified': user.is_verified,
                    'message': 'Registration successful'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Registration failed for {email}: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Registration failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @get_user_profile_docs
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @update_user_profile_docs
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @partial_update_user_profile_docs
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    def get_object(self):
        """Get or create user profile"""
        profile, created = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={}
        )
        return profile
    
    def update(self, request, *args, **kwargs):
        """Override update to handle profile creation"""
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Profile update failed for user {request.user.email}: {str(e)}")
            return Response(
                {"detail": "Profile update failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserUpdateView(generics.UpdateAPIView):
    """Separate view for updating user account information"""
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            logger.info(f"User account updated: {request.user.email}")
            return response
        except Exception as e:
            logger.error(f"User update failed for {request.user.email}: {str(e)}")
            return Response(
                {"detail": "Account update failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@login_history_docs
class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        return self.request.user.login_history.select_related('user').order_by('-login_time')[:50]


@mfa_setup_docs
class MFASetupView(generics.GenericAPIView):
    serializer_class = MFASetupSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        enable = serializer.validated_data.get('enable', True)
        
        try:
            with transaction.atomic():
                if enable:
                    return self._enable_mfa(user)
                else:
                    return self._disable_mfa(user)
                    
        except Exception as e:
            logger.error(f"MFA Setup Error for {user.email}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to configure MFA. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def _enable_mfa(self, user):
        """Enable MFA for user"""
        if user.mfa_enabled:
            return Response(
                {'detail': 'MFA is already enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate new secret
        secret = pyotp.random_base32(length=32)
        codes, hashes = generate_backup_codes()
        
        user.mfa_secret = secret
        user.mfa_enabled = True
        user.backup_codes = hashes
        user.save()
        
        # Generate provisioning URI
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name=getattr(settings, 'MFA_ISSUER_NAME', 'RiskGuard Pro')
        )
        
        logger.info(f"MFA enabled for user: {user.email}")
        
        return Response({
            'status': 'success',
            'secret': secret,
            'uri': totp_uri,
            'backup_codes': codes,
            'message': 'Scan the QR code with your authenticator app and save your backup codes'
        })

    def _disable_mfa(self, user):
        """Disable MFA for user"""
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.mfa_enabled = False
        user.mfa_secret = ''
        user.backup_codes = []
        user.save()
        
        logger.info(f"MFA disabled for user: {user.email}")
        
        return Response({
            'status': 'success',
            'message': 'MFA has been disabled'
        })


class MFAVerifyView(generics.GenericAPIView):
    serializer_class = MFAVerifySerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    @mfa_verify_docs
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uid = serializer.validated_data.get('uid')
        temp_token = serializer.validated_data.get('temp_token')
        mfa_code = serializer.validated_data.get('token')
        backup_code = serializer.validated_data.get('backup_code')
        
        try:
            user = self._get_user_from_token(uid, temp_token)
            
            # Verify MFA code or backup code
            if mfa_code and self._verify_mfa_code(user, mfa_code):
                return self._generate_final_tokens(user)
            elif backup_code and verify_backup_code(user, backup_code):
                logger.warning(f"Backup code used for MFA: {user.email}")
                return self._generate_final_tokens(user)
            else:
                self._log_mfa_failure(user, request)
                return Response(
                    {'detail': 'Invalid verification code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"MFA Verification Error: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Verification failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_user_from_token(self, uid, temp_token):
        """Extract and validate user from token"""
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
            
            # Check cache for temp token
            cache_key = f"mfa_temp_token:{user.id}"
            cached_token = cache.get(cache_key)
            
            if not cached_token or cached_token != temp_token:
                raise ValidationError("Invalid or expired token")
                
            if not default_token_generator.check_token(user, temp_token):
                raise ValidationError("Invalid token")
                
            return user
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise ValidationError("Invalid user")
        


    def _verify_mfa_code(self, user, code):
        """Verify MFA code with clock drift tolerance"""
        if not user.mfa_secret:
            return False
            
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(code, valid_window=1)

    def _generate_final_tokens(self, user):
        """Generate final JWT tokens after successful MFA"""
        refresh = RefreshToken.for_user(user)
        
        # Clear temp token from cache
        cache_key = f"mfa_temp_token:{user.id}"
        cache.delete(cache_key)
        
        logger.info(f"MFA verification successful for: {user.email}")
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'role': user.user_type,
                'mfa_enabled': user.mfa_enabled,
                'is_verified': user.is_verified
            },
            'mfa_verified': True
        })

    def _log_mfa_failure(self, user, request):
        """Log MFA verification failure"""
        try:
            LoginHistory.objects.create(
                user=user,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
                was_successful=False
            )
        except Exception as e:
            logger.error(f"Failed to log MFA failure: {str(e)}")

    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        return ip

    
       
class PasswordResetThrottle(AnonRateThrottle):
    rate = '3/hour'


@password_reset_request_docs
class PasswordResetRequestView(generics.GenericAPIView):
    throttle_classes = [PasswordResetThrottle]
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email'].lower()
        user = User.objects.filter(email=email, is_active=True).first()
        
        if user:
            try:
                # Generate password reset token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Store reset token in cache with expiration
                cache_key = f"password_reset:{user.id}"
                cache.set(cache_key, token, timeout=3600)  # 1 hour
                
                # Send password reset email
                send_password_reset_email(user, uid, token, request)
                
                logger.info(f"Password reset requested for: {user.email}")
                
            except Exception as e:
                logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        
        # Always return success to prevent email enumeration
        return Response(
            {'detail': 'If an account exists with this email, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )


@password_reset_confirm_docs
class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid, is_active=True)
            token = serializer.validated_data['token']
            
            # Check cached token
            cache_key = f"password_reset:{user.id}"
            cached_token = cache.get(cache_key)
            
            if cached_token != token or not default_token_generator.check_token(user, token):
                return Response(
                    {'detail': 'Invalid or expired reset link.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reset password
            with transaction.atomic():
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                # Clear the reset token
                cache.delete(cache_key)
                
                # Log password reset
                logger.info(f"Password reset completed for: {user.email}")
                
            return Response(
                {'detail': 'Password has been reset successfully.'},
                status=status.HTTP_200_OK
            )
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Password reset failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Verify old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                logger.info(f"Password changed for user: {user.email}")
                
            return Response(
                {'detail': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Password change failed for {user.email}: {str(e)}")
            return Response(
                {'detail': 'Password change failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

class PasswordChangeRequiredView(generics.GenericAPIView):
    """Handle forced password changes for expired passwords"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordChangeSerializer
    
    @password_change_required_get_docs
    def get(self, request):
        return Response({
            'detail': 'Your password has expired and must be changed',
            'password_expired': True,
            'last_change': request.user.last_password_change
        }, status=status.HTTP_403_FORBIDDEN)
    

    @password_change_required_post_docs
    def post(self, request):
        """Force password change for expired passwords"""
        if not request.user.is_password_expired():
            return Response(
                {'detail': 'Password change not required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Verify old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                logger.info(f"Expired password changed for user: {user.email}")
                
            return Response(
                {'detail': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Expired password change failed for {user.email}: {str(e)}")
            return Response(
                {'detail': 'Password change failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )