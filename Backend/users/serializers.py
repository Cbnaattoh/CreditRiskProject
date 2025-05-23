from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from .models import User, Notification
from django_otp.plugins.otp_totp.models import TOTPDevice

class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    email = serializers.EmailField()
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False
    )
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password
            )

            if not user:
                msg = _('Unable to log in with provided credentials.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "email" and "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs

class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email', 
            'first_name', 
            'last_name',
            'password', 
            'password2'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user details.
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'date_joined',
            'last_login',
            'is_2fa_enabled',
            'user_type'
        ]
        read_only_fields = [
            'id',
            'email',
            'date_joined',
            'last_login'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile updates.
    """
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'date_of_birth',
            'gender',
            'phone_number',
            'address',
            'city',
            'country',
            'postal_code',
            'job_title',
            'company',
            'industry',
            'bio',
            'profile_picture',
            'profile_picture_url',
            'timezone',
            'language',
            'theme_preference',
            'email_notifications',
            'sms_notifications',
            'push_notifications'
        ]

    def get_profile_picture_url(self, obj):
        return obj.get_profile_picture_url()

class UserPasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {"new_password": "Password fields didn't match."}
            )
        return attrs

class TwoFactorSetupSerializer(serializers.Serializer):
    """
    Serializer for 2FA setup.
    """
    action = serializers.ChoiceField(
        choices=['enable', 'disable'],
        required=True
    )
    token = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate(self, attrs):
        action = attrs.get('action')
        token = attrs.get('token')

        if action == 'enable' and not token:
            raise serializers.ValidationError(
                {"token": "Token is required to enable 2FA."}
            )

        return attrs

class TwoFactorVerifySerializer(serializers.Serializer):
    """
    Serializer for 2FA verification.
    """
    token = serializers.CharField(required=True)

class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    """
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    """
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {"new_password": "Password fields didn't match."}
            )
        return attrs

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for user notifications.
    """
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'is_read',
            'created_at'
        ]
        read_only_fields = fields