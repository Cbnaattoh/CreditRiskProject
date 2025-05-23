from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django_otp import devices_for_user
from ..models import User, UserActivity, Notification
from ..serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserPasswordChangeSerializer,
    TwoFactorSetupSerializer,
    NotificationSerializer
)
import logging

logger = logging.getLogger(__name__)

class UserRegisterView(generics.CreateAPIView):
    """
    Handles new user registration.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        # Additional setup for new users can go here
        logger.info(f"New user registered: {user.email}")

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Handles user profile retrieval and updates.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        # Record profile update activity
        UserActivity.objects.create(
            user=user,
            activity_type="PROFILE_UPDATE",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        logger.info(f"User profile updated: {user.email}")

class UserPasswordChangeView(APIView):
    """
    Handles password changes for authenticated users.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserPasswordChangeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']
        
        # Verify current password
        if not user.check_password(current_password):
            return Response(
                {'current_password': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Change password
        user.change_password(new_password)
        
        # Record password change activity
        UserActivity.objects.create(
            user=user,
            activity_type="PASSWORD_CHANGE",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        logger.info(f"User changed password: {user.email}")
        return Response(
            {'detail': 'Password updated successfully'},
            status=status.HTTP_200_OK
        )

class TwoFactorSetupView(APIView):
    """
    Handles two-factor authentication setup and management.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TwoFactorSetupSerializer

    def get(self, request, *args, **kwargs):
        """Returns 2FA setup status and configuration"""
        user = request.user
        devices = devices_for_user(user, confirmed=True)
        
        data = {
            'is_2fa_enabled': user.is_2fa_enabled,
            'has_device': bool(devices),
            # Include any other 2FA setup info needed by frontend
        }
        
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """Enables 2FA for the user"""
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        action = serializer.validated_data['action']
        
        if action == 'enable':
            if not user.has_2fa_device():
                return Response(
                    {'detail': 'No 2FA device configured'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.enable_2fa()
            
            # Record 2FA enable activity
            UserActivity.objects.create(
                user=user,
                activity_type="2FA_ENABLED",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            logger.info(f"User enabled 2FA: {user.email}")
            return Response(
                {'detail': 'Two-factor authentication enabled'},
                status=status.HTTP_200_OK
            )
        
        elif action == 'disable':
            user.disable_2fa()
            
            # Record 2FA disable activity
            UserActivity.objects.create(
                user=user,
                activity_type="2FA_DISABLED",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            logger.info(f"User disabled 2FA: {user.email}")
            return Response(
                {'detail': 'Two-factor authentication disabled'},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'detail': 'Invalid action'},
            status=status.HTTP_400_BAD_REQUEST
        )

class NotificationListView(generics.ListAPIView):
    """
    Returns a list of notifications for the authenticated user.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationMarkAsReadView(APIView):
    """
    Marks a notification as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        notification = get_object_or_404(
            Notification, 
            pk=pk, 
            user=request.user
        )
        notification.mark_as_read()
        return Response(
            {'detail': 'Notification marked as read'},
            status=status.HTTP_200_OK
        )