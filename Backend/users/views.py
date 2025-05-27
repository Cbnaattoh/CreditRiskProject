from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import UserProfile, LoginHistory
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
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

User = get_user_model()

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200 and request.user.is_authenticated:
            LoginHistory.objects.create(
                user=request.user,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                session_key=request.session.session_key,
                was_successful=True
            )

            # Add MFA information to response
            user = request.user
            response.data['mfa_enabled'] = user.mfa_enabled
            response.data['is_verified'] = user.is_verified

            # If MFA is enabled, include temp token and flag
            if user.mfa_enabled:
                temp_token = default_token_generator.make_token(user)
                response.data['requires_mfa'] = True
                response.data['temp_token'] = temp_token
                response.data['access'] = None
        return response
    
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

    def perform_create(self, serializer):
        user = serializer.save()

    #     # Send verification email if needed
    #     if settings.EMAIL_VERIFICATION_REQUIRED:
    #         self.send_verification_email(user)
        
    # def send_verification_email(self, user):
    #     # Implement email verificatio  logic here
    #     pass

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

class MFASetupView(generics.GenericAPIView):
    serializer_class = MFASetupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        enable = serializer.validated_data['enable']
        
        if enable and not user.mfa_enabled:
            # Generate a new secret if enabling for the first time
            user.mfa_secret = pyotp.random_base32()
            user.mfa_enabled = True
            user.save()
            
            # Generate provisioning URI for authenticator app
            totp_uri = pyotp.totp.TOTP(user.mfa_secret).provisioning_uri(
                name=user.email,
                issuer_name="RiskGuard Pro"
            )
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(totp_uri)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_code = base64.b64encode(buffer.getvalue()).decode()

              # Generate backup codes
            backup_codes = [pyotp.random_base32(length=10) for _ in range(5)]
            
            return Response({
                'status': 'MFA enabled',
                'secret': user.mfa_secret,
                'qr_code': qr_code,
                'backup_codes': backup_codes,
                'message': 'Store these backup codes securely'
            }, status=status.HTTP_200_OK)
        
        elif not enable and user.mfa_enabled:
            # Disable MFA
            user.mfa_enabled = False
            user.mfa_secret = ''
            user.save()
            return Response({'status': 'MFA disabled'}, status=status.HTTP_200_OK)
        
        return Response({'status': 'No changes made'}, status=status.HTTP_200_OK)

class MFAVerifyView(generics.GenericAPIView):
    serializer_class = MFAVerifySerializer
    permission_classes = [permissions.AllowAny]  # AllowAny because user isn't authenticated yet

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get user from temp token
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Invalid user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token is valid for this user
        if not default_token_generator.check_token(user, serializer.validated_data['temp_token']):
            return Response(
                {'detail': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if MFA is enabled (should be, but verify)
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled for this account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the MFA code
        totp = pyotp.TOTP(user.mfa_secret)
        token = serializer.validated_data['token']
        
        # Check both current and previous valid window (for clock skew)
        if not totp.verify(token, valid_window=1):
            # Check backup codes if main token fails
            if not self._check_backup_code(user, token):
                return Response(
                    {'detail': 'Invalid token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # If we get here, verification was successful
        # Generate final access token
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'mfa_enabled': user.mfa_enabled,
            'is_verified': user.is_verified
        }, status=status.HTTP_200_OK)
    
    def _check_backup_code(self, user, code):
        """Check if the provided code matches a backup code"""
        # In a real implementation, you'd check against stored backup codes
        # This is a simplified version
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