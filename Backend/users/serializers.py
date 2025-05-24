from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, LoginHistory
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom claims
        data.update({
            'email': self.user.email,
            'user_type': self.user.user_type,
            'mfa_enabled': self.user.mfa_enabled,
            'is_verified': self.user.is_verified
        })
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'user_type', 'phone_number', 'is_verified', 'mfa_enabled']
        read_only_fields = ['is_verified', 'mfa_enabled']

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['email', 'user_type', 'profile_picture', 'company', 'job_title', 
                 'department', 'bio', 'timezone']
        extra_kwargs = {
            'profile_picture': {'required': False}
        }

class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ['ip_address', 'user_agent', 'login_time', 'logout_time', 'was_successful']

class MFASetupSerializer(serializers.Serializer):
    enable = serializers.BooleanField(required=True)

class MFAVerifySerializer(serializers.Serializer):
    token = serializers.CharField(required=True, max_length=6)