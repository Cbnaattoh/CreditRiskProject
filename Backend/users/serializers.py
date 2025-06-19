from rest_framework import serializers, exceptions
from django.contrib.auth import get_user_model, authenticate
from .models import UserProfile, LoginHistory
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from django.utils import timezone
import logging

User = get_user_model()
USER_TYPES = [choice[0] for choice in User.USER_TYPES]
logger = logging.getLogger(__name__)

# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     def validate(self, attrs):
#         try:
#             data = super().validate(attrs)
#         except exceptions.AuthenticationFailed as e:
#             # Log failed authentication attempts
#             logger.warning(f"Failed login attempt for email: {attrs.get('email', 'unknown')}")
#             raise exceptions.ValidationError(
#                 {"detail": "Invalid email or password"}
#             )
        
#         # Add custom claims
#         data.update({
#             'user': {
#                 'id': self.user.id,
#                 'email': self.user.email,
#                 'name': f"{self.user.first_name} {self.user.last_name}",
#                 'role': self.user.user_type,
#                 'mfa_enabled': self.user.mfa_enabled, # should be removed for security concerns
#                 'is_verified': self.user.is_verified,
#                 'password_expired': self.user.is_password_expired(), # should be removed for security concerns
#                 'requires_password_change': self.user.is_password_expired()
#             },
#             'mfa_enabled': self.user.mfa_enabled, # should be removed for security concerns
#             'is_verified': self.user.is_verified, # should be removed for security concerns
#             'requires_password_change': self.user.is_password_expired()
#         })
#         return data

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Improved token serializer with better security practices
    """
    
    def validate(self, attrs):
        try:
            # Use authenticate method for better security
            email = attrs.get('email', '').strip().lower()
            password = attrs.get('password', '')
            
            # Additional validation
            if not email or not password:
                raise exceptions.ValidationError(
                    {"detail": "Email and password are required"}
                )
            
            user = authenticate(username=email, password=password)
            if not user:
                # Log failed attempt without exposing user existence
                logger.warning(
                    f"Failed login attempt for email: {email}",
                    extra={'email': email, 'timestamp': timezone.now()}
                )
                raise exceptions.AuthenticationFailed(
                    "Invalid email or password"
                )
            
            # Check if user is active
            if not user.is_active:
                logger.warning(
                    f"Login attempt for inactive account: {email}",
                    extra={'email': email, 'user_id': user.id}
                )
                raise exceptions.AuthenticationFailed(
                    "Account is inactive"
                )
            
            # Set user for token generation
            self.user = user
            
            # Generate tokens
            refresh = self.get_token(user)
            data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            
            # Add minimal user info (remove sensitive fields)
            data.update({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip(),
                    'role': user.user_type,
                    'is_verified': user.is_verified,
                }
            })
            
            # Handle MFA separately in view
            return data
            
        except exceptions.AuthenticationFailed:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during authentication: {str(e)}")
            raise exceptions.ValidationError(
                {"detail": "Authentication failed"}
            )


# class UserSerializer(serializers.ModelSerializer):
#     profile_picture = serializers.SerializerMethodField()
#     full_name = serializers.SerializerMethodField()
#     password_expired = serializers.SerializerMethodField()

#     class Meta:
#         model = User
#         # fields = [
#         #     'email', 'first_name', 'last_name', 'user_type', 'phone_number',
#         #     'is_verified', 'mfa_enabled', 'profile_picture'
#         # ]
#         fields = [
#             'id', 'email', 'first_name', 'last_name', 'full_name', 'user_type', 
#             'phone_number', 'is_verified', 'mfa_enabled', 'profile_picture',
#             'date_joined', 'last_login', 'password_expired'
#         ]
#         read_only_fields = ['id','is_verified', 'mfa_enabled', 'date_joined','last_login','password_expired']
    
#     def get_profile_picture(self, obj):
#         if hasattr(obj, 'profile') and obj.profile.profile_picture:
#             request = self.context.get('request')
#             if request:
#                 return request.build_absolute_uri(obj.profile.profile_picture.url)
#         return None
    
#     def get_full_name(self, obj):
#         return f"{obj.first_name} {obj.last_name}".strip()
    
#     def get_password_expired(self, obj):
#         return obj.is_password_expired()



class UserSerializer(serializers.ModelSerializer):
    """
    Improved user serializer with better field management
    """
    profile_picture = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 
            'user_type', 'phone_number', 'is_verified', 'profile_picture', 
            'date_joined', 'last_login'
        ]
        read_only_fields = [
            'id', 'is_verified', 'date_joined', 'last_login'
        ]
        extra_kwargs = {
            'phone_number': {'write_only': True},
            'email': {'required': True},
        }

    def get_profile_picture(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.profile_picture.url)
        return None

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    



class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8,
        help_text='Password must be at least 8 characters long'
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
    terms_accepted = serializers.BooleanField(required=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'profile_picture', 'user_type', 'mfa_enabled', 'terms_accepted'
        ]
        extra_kwargs = {
            'first_name': {'required': True, 'min_length': 2},
            'last_name': {'required': True, 'min_length': 2},
            'email': {'help_text': 'Enter a valid email address'},
            'phone_number': {'required': False, 'allow_blank': True}
        }

    def to_internal_value(self, data):
        """Override to handle FormData boolean conversion and file handling"""
        # Handle mutable data
        if hasattr(data, '_mutable') and not data._mutable:
            data._mutable = True
        
        # Convert string booleans to actual booleans for FormData
        boolean_fields = ['mfa_enabled', 'terms_accepted']
        for field in boolean_fields:
            if field in data:
                value = data[field]
                if isinstance(value, str):
                    # Handle various string representations of booleans
                    data[field] = value.lower() in ('true', '1', 'yes', 'on')
                elif isinstance(value, bool):
                    data[field] = value
                else:
                    # Default to False for any other type
                    data[field] = False
        
        # Handle empty strings for optional fields
        optional_fields = ['phone_number']
        for field in optional_fields:
            if field in data and data[field] == '':
                data[field] = None
        
        try:
            return super().to_internal_value(data)
        except Exception as e:
            print(f"Error in to_internal_value: {e}")
            print(f"Data received: {data}")
            raise

    def validate_email(self, value):
        """Custom email validation with consistent normalization"""
        if not value:
            raise serializers.ValidationError("Email is required.")
        
        try:
            validate_email(value)
        except Exception as e:
            raise serializers.ValidationError("Please enter a valid email address.")
        
        normalized_email = User.objects.normalize_email(value).lower()
        
        # Check if email already exists
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return normalized_email

    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value and value.strip():  # Only validate if not empty
            if not value.startswith('+'):
                raise serializers.ValidationError("Phone number must include country code (e.g., +1234567890)")
        return value

    def validate_terms_accepted(self, value):
        """Ensure terms are accepted"""
        if not value:
            raise serializers.ValidationError("You must accept the terms and conditions.")
        return value

    def validate_profile_picture(self, value):
        """Validate profile picture"""
        if value:
            # Check file size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Profile picture must be smaller than 5MB.")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_types:
                raise serializers.ValidationError("Only JPEG, PNG, GIF, and WebP images are allowed.")
        
        return value

    def validate(self, data):
        """Cross-field validation"""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        
        # Validate password strength
        try:
            validate_password(data['password'])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return data

    def validate_user_type(self, value):
        """Validate user type"""
        if value not in [choice[0] for choice in User.USER_TYPES]:
            raise serializers.ValidationError("Invalid user type.")
        
        # Restrict certain user types during registration
        if value == 'ADMIN':
            raise serializers.ValidationError("Admin accounts cannot be created through registration.")
        
        return value

    def create(self, validated_data):
        """Create user with profile"""
        profile_picture = validated_data.pop('profile_picture', None)
        validated_data.pop('confirm_password', None)
        validated_data.pop('terms_accepted', None)
        
        try:
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
            
            logger.info(f"New user registered: {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"User registration failed: {str(e)}")
            raise serializers.ValidationError("Registration failed. Please try again.")
        

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    full_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['email', 'first_name', 'last_name','full_name', 'phone_number', 'user_type','profile_picture', 'profile_picture_url', 'company', 'job_title', 
                 'department', 'bio', 'timezone']
        extra_kwargs = {
            'profile_picture': {'required': False},
            'bio': {'max_length': 500}
        }
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None

class LoginHistorySerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    session_duration = serializers.SerializerMethodField()

    class Meta:
        model = LoginHistory
        fields = ['id','user_email','ip_address', 'user_agent', 'login_timestamp', 'was_successful', 'session_duration']

    def get_session_duration(self, obj):
        if obj.logout_time and obj.login_time:
            duration = obj.logout_time - obj.login_time
            return str(duration)
        return None

class MFASetupSerializer(serializers.Serializer):
    enable = serializers.BooleanField(required=True)
    backup_codes_acknowledged = serializers.BooleanField(required=False, default=False)
    
    def validate(self, data):
        if data['enable'] and not data.get('backup_codes_acknowledged'):
            raise serializers.ValidationError(
                "You must acknowledge that you've saved your backup codes."
            )
        return data
    
    
class MFASetupVerifySerializer(serializers.Serializer):
    """
    Serializer for verifying MFA setup by validating the first TOTP code
    """
    token = serializers.CharField(
        required=True, 
        max_length=6, 
        min_length=6,
        help_text="6-digit TOTP code from authenticator app"
    )
    
    def validate_token(self, value):
        """Validate that token contains only digits"""
        if not value.isdigit():
            raise serializers.ValidationError("Token must contain only digits.")
        
        if len(value) != 6:
            raise serializers.ValidationError("Token must be exactly 6 digits.")
            
        return value
    

class MFAVerifySerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    temp_token = serializers.CharField(required=True)
    token = serializers.CharField(required=True, max_length=6, min_length=6)
    backup_code = serializers.CharField(required=False, max_length=8)
    
    def validate_token(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Token must contain only digits.")
        return value

    def validate(self, data):
        if not data.get('token') and not data.get('backup_code'):
            raise serializers.ValidationError("Either token or backup_code is required.")
        return data
    

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError({"new_password": "New password must be different from old password"})
        
        return data
    
    def save(self, user):
        """Save the new password and update last_password_change"""
        user.set_password(self.validated_data['new_password'])
        user.save()

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Normalize email consistently
        normalized_email = User.objects.normalize_email(value).lower()
        # Don't reveal if email exists or not for security
        return normalized_email

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    uid = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8, write_only=True)
    confirm_password = serializers.CharField(required=True, min_length=8, write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        return data
    

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information"""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number']
        extra_kwargs = {
            'first_name': {'required': True, 'min_length': 2},
            'last_name': {'required': True, 'min_length': 2},
        }

    def validate_phone_number(self, value):
        """Consistent phone validation with model and registration"""
        if value and not value.startswith('+'):
            raise serializers.ValidationError("Phone number must include country code (e.g., +1234567890)")
        return value
    
    def validate(self, data):
        """Check if password needs changing after update"""
        validated_data = super().validate(data)
        
        # If this is being called in a context where we have the user instance
        if hasattr(self, 'instance') and self.instance:
            if self.instance.is_password_expired():
                # Might want to add a warning or handle this case
                pass
        
        return validated_data
