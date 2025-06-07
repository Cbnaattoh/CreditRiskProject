from rest_framework import serializers, exceptions
from django.contrib.auth import get_user_model
from .models import UserProfile, LoginHistory
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password

User = get_user_model()
USER_TYPES = [choice[0] for choice in User.USER_TYPES]

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except exceptions.AuthenticationFailed:
            raise exceptions.ValidationError(
                {"detail": "Invalid email or password"}
            )
        
        # Add custom claims
        data.update({
            'user': {
                'id': self.user.id,
                'email': self.user.email,
                'name': f"{self.user.first_name} {self.user.last_name}",
                'role': self.user.user_type,
                'mfa_enabled': self.user.mfa_enabled
            },
            'mfa_enabled': self.user.mfa_enabled,
            'is_verified': self.user.is_verified
        })
        return data

class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'user_type', 'phone_number',
            'is_verified', 'mfa_enabled', 'profile_picture'
        ]
        read_only_fields = ['is_verified', 'mfa_enabled']
    
    def get_profile_picture(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_picture:
            return self.context['request'].build_absolute_uri(obj.profile.profile_picture.url)
    

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True
    )

    user_type = serializers.ChoiceField(choices=User.USER_TYPES, required=True)
    mfa_enabled = serializers.BooleanField(required=False, default=False)


    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'profile_picture', 'user_type', 'mfa_enabled'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }


    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        validate_password(data['password'])
        return data

    def validate_user_type(self, value):
        if value not in USER_TYPES:
            raise serializers.ValidationError("Invalide user type.")
        return value

    def create(self, validated_data):
        profile_picture = validated_data.pop('profile_picture', None)
        validated_data.pop('confirm_password', None)
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            user_type=validated_data['user_type'],
            mfa_enabled=validated_data.get('mfa_enabled', False)
        )
        
        # Create user profile with picture if provided
        UserProfile.objects.create(
            user=user,
            profile_picture=profile_picture
        )
        
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'user_type', 'profile_picture', 'company', 'job_title', 
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

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    uid = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True, min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data
