from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import UserProfile, LoginHistory
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.throttling import AnonRateThrottle
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserProfileSerializer,
    LoginHistorySerializer,
    MFASetupSerializer,
    MFAVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserRegisterSerializer
)
import pyotp
import qrcode
import io
import base64
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        
        if not email or not password:
            return Response(
                {"detail": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # First verify user exists to prevent auth backend from creating one
            user = User.objects.get(email=email)
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                LoginHistory.objects.create(
                    user=user,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    was_successful=True
                )
                
                if user.mfa_enabled:
                    temp_token = default_token_generator.make_token(user)
                    response.data['requires_mfa'] = True
                    response.data['temp_token'] = temp_token
                    response.data['access'] = None
            
            return response
            
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data.get('email')
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "User with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.login_history.all().order_by('-login_time')[:20]

# class MFASetupView(generics.GenericAPIView):
#     serializer_class = MFASetupSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         user = request.user
#         enable = serializer.validated_data['enable']
        
#         if enable and not user.mfa_enabled:
#             # Generate a new secret if enabling for the first time
#             user.mfa_secret = pyotp.random_base32()
#             user.mfa_enabled = True
#             user.save()
            
#             # Generate provisioning URI for authenticator app
#             totp_uri = pyotp.totp.TOTP(user.mfa_secret).provisioning_uri(
#                 name=user.email,
#                 issuer_name="RiskGuard Pro"
#             )
            
#             qr = qrcode.QRCode(
#                 version=1,
#                 error_correction=qrcode.constants.ERROR_CORRECT_L,
#                 box_size=10,
#                 border=4,
#             )
#             qr.add_data(totp_uri)
#             qr.make(fit=True)
            
#             img = qr.make_image(fill_color="black", back_color="white")
#             buffer = io.BytesIO()
#             img.save(buffer, format="PNG")
#             qr_code = base64.b64encode(buffer.getvalue()).decode()

#               # Generate backup codes
#             backup_codes = [pyotp.random_base32(length=10) for _ in range(5)]
            
#             return Response({
#                 'status': 'MFA enabled',
#                 'secret': user.mfa_secret,
#                 'qr_code': qr_code,
#                 'backup_codes': backup_codes,
#                 'message': 'Store these backup codes securely'
#             }, status=status.HTTP_200_OK)
        
#         elif not enable and user.mfa_enabled:
#             # Disable MFA
#             user.mfa_enabled = False
#             user.mfa_secret = ''
#             user.save()
#             return Response({'status': 'MFA disabled'}, status=status.HTTP_200_OK)
        
#         return Response({'status': 'No changes made'}, status=status.HTTP_200_OK)

# class MFAVerifyView(generics.GenericAPIView):
#     serializer_class = MFAVerifySerializer
#     permission_classes = [permissions.AllowAny]  # AllowAny because user isn't authenticated yet

#     def post(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         try:
#             # Get user from temp token
#             uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
#             user = User.objects.get(pk=uid)
#         except (TypeError, ValueError, OverflowError, User.DoesNotExist):
#             return Response(
#                 {'detail': 'Invalid user'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         # Verify token is valid for this user
#         if not default_token_generator.check_token(user, serializer.validated_data['temp_token']):
#             return Response(
#                 {'detail': 'Invalid token'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         # Check if MFA is enabled (should be, but verify)
#         if not user.mfa_enabled:
#             return Response(
#                 {'detail': 'MFA is not enabled for this account'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         # Verify the MFA code
#         totp = pyotp.TOTP(user.mfa_secret)
#         token = serializer.validated_data['token']
        
#         # Check both current and previous valid window (for clock skew)
#         if not totp.verify(token, valid_window=1):
#             # Check backup codes if main token fails
#             if not self._check_backup_code(user, token):
#                 return Response(
#                     {'detail': 'Invalid token'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
        
#         # If we get here, verification was successful
#         # Generate final access token
#         refresh = CustomTokenObtainPairSerializer.get_token(user)
        
#         return Response({
#             'access': str(refresh.access_token),
#             'refresh': str(refresh),
#             'mfa_enabled': user.mfa_enabled,
#             'is_verified': user.is_verified
#         }, status=status.HTTP_200_OK)
    
#     def _check_backup_code(self, user, code):
#         """Check if the provided code matches a backup code"""
#         # In a real implementation, you'd check against stored backup codes
#         # This is a simplified version
#         return False

class MFASetupView(generics.GenericAPIView):
    serializer_class = MFASetupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user = request.user
            enable = serializer.validated_data.get('enable', True)
            
            if enable:
                # Generate new secret with proper validation
                secret = self._generate_mfa_secret()
                
                user.mfa_secret = secret
                user.mfa_enabled = True
                user.save()
                
                # Generate provisioning URI
                totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                    name=user.email,
                    issuer_name="RiskGuard Pro"
                )
                
                # Generate backup codes
                backup_codes = self._generate_backup_codes()
                
                return Response({
                    'status': 'success',
                    'secret': secret,  # For manual entry
                    'uri': totp_uri,   # For QR code generation
                    'backup_codes': backup_codes,
                    'message': 'Scan the QR code with your authenticator app'
                })
                
            elif not enable and user.mfa_enabled:
                # Disable MFA
                user.mfa_enabled = False
                user.mfa_secret = None
                user.save()
                return Response({'status': 'MFA disabled'})
                
            return Response({'status': 'No changes made'})
            
        except Exception as e:
            logger.error(f"MFA Setup Error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to configure MFA. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _generate_mfa_secret(self):
        """Generate and validate MFA secret"""
        secret = pyotp.random_base32(length=32)
        if not secret or len(secret) < 16:
            raise APIException("Failed to generate secure MFA secret")
        return secret

    def _generate_backup_codes(self):
        """Generate backup codes with proper formatting"""
        return [f"BC-{pyotp.random_base32(length=8)}" for _ in range(5)]


class MFAVerifyView(generics.GenericAPIView):
    serializer_class = MFAVerifySerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Get user from temp token
            user = self._get_user_from_token(
                serializer.validated_data['uid'],
                serializer.validated_data['temp_token']
            )
            
            # Verify MFA code
            if not self._verify_mfa_code(user, serializer.validated_data['token']):
                return Response(
                    {'detail': 'Invalid verification code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate final tokens
            refresh = CustomTokenObtainPairSerializer.get_token(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'mfa_enabled': user.mfa_enabled,
                'is_verified': True
            })
            
        except Exception as e:
            logger.error(f"MFA Verification Error: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Verification failed'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _get_user_from_token(self, uid, temp_token):
        """Extract and validate user from token"""
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
            if not default_token_generator.check_token(user, temp_token):
                raise ValidationError("Invalid token")
            return user
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise ValidationError("Invalid user")

    def _verify_mfa_code(self, user, code):
        """Verify MFA code with clock drift tolerance"""
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(code, valid_window=1) or self._check_backup_code(user, code)

    def _check_backup_code(self, user, code):
        """Check against stored backup codes (placeholder implementation)"""
        # Implement your actual backup code verification logic here
        return False

    
       
class PasswordResetThrottle(AnonRateThrottle):
    rate = '5/hour'

class PasswordResetRequestView(generics.GenericAPIView):
    throttle_classes = [PasswordResetThrottle]
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()
        
        if user:
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL
            reset_url = request.build_absolute_uri(
                reverse('password_reset_confirm') + f'?uid={uid}&token={token}'
            )
            
            # Send email
            send_mail(
                'Password Reset Request',
                f'Click the link to reset your password: {reset_url}',
                DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        
        # Always return success to prevent email enumeration
        return Response(
            {'detail': 'If an account exists with this email, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        
        if user is not None and default_token_generator.check_token(user, serializer.validated_data['token']):
            user.set_password(serializer.validated_data['new_password'])
            user.last_password_change = timezone.now()
            user.save()
            return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        
        return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)
    

class PasswordChangeRequiredView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordResetConfirmSerializer
    
    def get(self, request):
        return Response(
            {'detail': 'Your password has expired and must be changed'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response(
            {'detail': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )