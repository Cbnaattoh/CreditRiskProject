from rest_framework import serializers, exceptions
from django.contrib.auth import get_user_model, authenticate
from .models import UserProfile, LoginHistory, Permission, Role, UserRole, PermissionLog
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from django.utils import timezone
import logging

User = get_user_model()
USER_TYPES = [choice[0] for choice in User.USER_TYPES]
logger = logging.getLogger(__name__)


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission model"""
    
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'description', 'content_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model with permission management"""
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'description', 'is_active','is_default', 'permissions', 
            'permission_ids', 'user_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_count']
    
    def get_user_count(self, obj):
        """Get count of users with this role"""
        return UserRole.objects.filter(
            role=obj, 
            is_active=True,
            expires_at__isnull=True
        ).count() + UserRole.objects.filter(
            role=obj,
            is_active=True,
            expires_at__gt=timezone.now()
        ).count()
    
    def validate_name(self, value):
        """Validate role name"""
        if self.instance and self.instance.name == value:
            return value
            
        if Role.objects.filter(name=value).exists():
            raise serializers.ValidationError("Role with this name already exists")
        return value
    
    def create(self, validated_data):
        """Create role with permissions"""
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)
        
        if permission_ids:
            permissions = Permission.objects.filter(id__in=permission_ids)
            role.permissions.set(permissions)
        
        return role
    
    def update(self, instance, validated_data):
        """Update role and its permissions"""
        permission_ids = validated_data.pop('permission_ids', None)
        
        # Update role fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update permissions if provided
        if permission_ids is not None:
            permissions = Permission.objects.filter(id__in=permission_ids)
            instance.permissions.set(permissions)
        
        return instance



class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for UserRole model"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    assigned_by_email = serializers.CharField(source='assigned_by.email', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'user', 'role', 'user_email', 'user_name', 'role_name',
            'assigned_by', 'assigned_by_email', 'assigned_at', 'is_active',
            'expires_at', 'is_expired'
        ]
        read_only_fields = ['id', 'assigned_at', 'is_expired']
    
    def validate(self, data):
        """Validate role assignment with RBAC checks"""
        user = data.get('user')
        role = data.get('role')
        expires_at = data.get('expires_at')
        
        # Get the requesting user from context
        request_user = self.context.get('request').user if self.context.get('request') else None
        
        # Check if requesting user can assign this role
        if request_user and not request_user.can_assign_role(role.name):
            if role.name in ['Administrator', 'Risk Analyst', 'Compliance Auditor']:
                if not (request_user.is_superuser or request_user.has_role('Administrator')):
                    raise serializers.ValidationError(
                        f"You don't have permission to assign the role '{role.name}'"
                    )
        
        # Check if user already has this role
        if self.instance is None:
            existing = UserRole.objects.filter(
                user=user, 
                role=role, 
                is_active=True
            ).first()
            
            if existing and not existing.is_expired:
                raise serializers.ValidationError(
                    f"User already has the role '{role.name}'"
                )
        
        # Validate expiration date
        if expires_at and expires_at <= timezone.now():
            raise serializers.ValidationError(
                "Expiration date must be in the future"
            )
        
        return data
    

class UserWithRolesSerializer(serializers.ModelSerializer):
    """Extended User serializer with role information"""
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    active_role_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'user_type',
            'is_active','is_verified', 'date_joined', 'roles', 'permissions',
            'active_role_count'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_roles(self, obj):
        """Get user's active roles"""
        roles = obj.get_roles()
        return [{'id': role.id, 'name': role.name} for role in roles]
    
    def get_permissions(self, obj):
        """Get user's permissions from roles"""
        permissions = obj.get_permissions()
        return [{'id': perm.id, 'codename': perm.codename, 'name': perm.name} 
                for perm in permissions]
    
    def get_active_role_count(self, obj):
        """Get count of active roles"""
        return obj.get_roles().count()
    

class RoleAssignmentSerializer(serializers.Serializer):
    """Serializer for bulk role assignments with RBAC validation"""
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    role_id = serializers.IntegerField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate_user_ids(self, value):
        """Validate that all user IDs exist"""
        existing_ids = User.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        
        if missing_ids:
            raise serializers.ValidationError(
                f"Users with IDs {list(missing_ids)} do not exist"
            )
        
        return value
    
    def validate_role_id(self, value):
        """Validate that role exists and can be assigned"""
        try:
            role = Role.objects.get(id=value)
            if not role.is_active:
                raise serializers.ValidationError("Cannot assign inactive role")
                
            # Check if requesting user can assign this role
            request_user = self.context.get('request').user if self.context.get('request') else None
            if request_user and not request_user.can_assign_role(role.name):
                if role.name in ['Administrator', 'Risk Analyst', 'Compliance Auditor']:
                    if not (request_user.is_superuser or request_user.has_role('Administrator')):
                        raise serializers.ValidationError(
                            f"You don't have permission to assign the role '{role.name}'"
                        )
            
            return value
        except Role.DoesNotExist:
            raise serializers.ValidationError("Role does not exist")
    
    def validate_expires_at(self, value):
        """Validate expiration date"""
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future")
        return value


class PermissionLogSerializer(serializers.ModelSerializer):
    """Serializer for Permission audit logs"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = PermissionLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'permission_codename',
            'resource_type', 'resource_id', 'action', 'ip_address',
            'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class UserPermissionCheckSerializer(serializers.Serializer):
    """Serializer for checking user permissions"""
    permission_codename = serializers.CharField(max_length=100)
    resource_type = serializers.CharField(max_length=100, required=False)
    resource_id = serializers.CharField(max_length=100, required=False)
    
    def validate_permission_codename(self, value):
        """Validate that permission exists"""
        if not Permission.objects.filter(codename=value).exists():
            raise serializers.ValidationError("Permission does not exist")
        return value


class RolePermissionUpdateSerializer(serializers.Serializer):
    """Serializer for updating role permissions"""
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True
    )
    action = serializers.ChoiceField(choices=['add', 'remove', 'set'])
    
    def validate_permission_ids(self, value):
        """Validate that all permission IDs exist"""
        if value:
            existing_ids = Permission.objects.filter(id__in=value).values_list('id', flat=True)
            missing_ids = set(value) - set(existing_ids)
            
            if missing_ids:
                raise serializers.ValidationError(
                    f"Permissions with IDs {list(missing_ids)} do not exist"
                )
        
        return value



class UserRoleHistorySerializer(serializers.Serializer):
    """Serializer for user role history"""
    user_id = serializers.IntegerField()
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    
    def validate_user_id(self, value):
        """Validate that user exists"""
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist")
        return value
    
    def validate(self, data):
        """Validate date range"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("Start date must be before end date")
        
        return data


class DetailedRoleSerializer(RoleSerializer):
    """Detailed role serializer with user assignments"""
    user_assignments = serializers.SerializerMethodField()
    
    class Meta(RoleSerializer.Meta):
        fields = RoleSerializer.Meta.fields + ['user_assignments']
    
    def get_user_assignments(self, obj):
        """Get users assigned to this role"""
        assignments = UserRole.objects.filter(
            role=obj,
            is_active=True
        ).select_related('user', 'assigned_by')
        
        return [{
            'user_id': assignment.user.id,
            'user_email': assignment.user.email,
            'user_name': assignment.user.get_full_name(),
            'assigned_at': assignment.assigned_at,
            'assigned_by': assignment.assigned_by.email if assignment.assigned_by else None,
            'expires_at': assignment.expires_at,
            'is_expired': assignment.is_expired
        } for assignment in assignments]


class UserRoleSummarySerializer(serializers.ModelSerializer):
    """Summary serializer for user roles"""
    total_users = serializers.SerializerMethodField()
    active_users = serializers.SerializerMethodField()
    expired_assignments = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'is_active', 'total_users', 'active_users', 'expired_assignments']
    
    def get_total_users(self, obj):
        """Get total users ever assigned to this role"""
        return UserRole.objects.filter(role=obj).count()
    
    def get_active_users(self, obj):
        """Get currently active users"""
        return UserRole.objects.filter(
            role=obj,
            is_active=True,
            expires_at__isnull=True
        ).count() + UserRole.objects.filter(
            role=obj,
            is_active=True,
            expires_at__gt=timezone.now()
        ).count()
    
    def get_expired_assignments(self, obj):
        """Get count of expired assignments"""
        return UserRole.objects.filter(
            role=obj,
            is_active=True,
            expires_at__lte=timezone.now()
        ).count()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Improved token serializer with better security practices
    """
    
    def validate(self, attrs):
        try:
            email = attrs.get('email', '').strip().lower()
            password = attrs.get('password', '')
            
            
            if not email or not password:
                raise exceptions.ValidationError(
                    {"detail": "Email and password are required"}
                )
            
            user = authenticate(username=email, password=password)
            if not user:
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

            user_roles = [{'id': role.id, 'name': role.name} for role in user.get_roles()]
            user_permissions = [perm.codename for perm in user.get_permissions()]
            
           
            data.update({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip(),
                    'role': user.user_type,
                    'is_verified': user.is_verified,
                    'mfa_enabled': user.mfa_enabled,
                    'mfa_fully_configured': user.is_mfa_fully_configured,
                    'roles': user_roles,
                    'permissions': user_permissions,
                }
            })
            return data
            
        except exceptions.AuthenticationFailed:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during authentication: {str(e)}")
            raise exceptions.ValidationError(
                {"detail": "Authentication failed"}
            )


class UserSerializer(serializers.ModelSerializer):
    """
    Improved user serializer with better field management
    """
    profile_picture = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    mfa_fully_configured = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 
            'user_type', 'phone_number', 'is_verified', 'profile_picture', 
            'date_joined', 'last_login', 'mfa_fully_configured'
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
    
    def get_mfa_fully_configured(self, obj):
        return obj.is_mfa_fully_configured
    

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

    user_type = serializers.ChoiceField(
        choices=[('CLIENT', 'Client User')],
        default='CLIENT',
        read_only=True,
        help_text='User type must be CLIENT. Admin accounts cannot be created through registration.'
    )
    enable_mfa = serializers.BooleanField(
        required=False, 
        default=False, 
        write_only=True,
        help_text='Request MFA setup after registration. You will need to complete setup before full access.'
    )
    terms_accepted = serializers.BooleanField(required=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'profile_picture', 'user_type', 'enable_mfa', 'terms_accepted'
        ]
        extra_kwargs = {
            'first_name': {'required': True, 'min_length': 2},
            'last_name': {'required': True, 'min_length': 2},
            'email': {'help_text': 'Enter a valid email address'},
            'phone_number': {'required': False, 'allow_blank': True}
        }

    def to_internal_value(self, data):
        """Override to handle FormData boolean conversion and file handling"""
     
        if hasattr(data, '_mutable') and not data._mutable:
            data._mutable = True
        
        # Convert string booleans to actual booleans for FormData
        boolean_fields = ['enable_mfa', 'terms_accepted']
        for field in boolean_fields:
            if field in data:
                value = data[field]
                if isinstance(value, str):
                    data[field] = value.lower() in ('true', '1', 'yes', 'on')
                elif isinstance(value, bool):
                    data[field] = value
                else:
                    data[field] = False
        
        # Force user_type to CLIENT if not provided for security
        data['user_type'] = 'CLIENT'
        
        
        optional_fields = ['phone_number']
        for field in optional_fields:
            if field in data and data[field] == '':
                data[field] = None
        
        try:
            return super().to_internal_value(data)
        except Exception as e:
            logger.error(f"Error in to_internal_value: {e}")
            raise
    
    def validate_user_type(self, value):
        """FIXED: Force CLIENT role for registration security"""
        if value != 'CLIENT':
            raise serializers.ValidationError(
                "Only Client accounts can be created through registration. "
                "Contact an administrator for other account types."
            )
        return value
    

    def validate_email(self, value):
        """Custom email validation with consistent normalization"""
        if not value:
            raise serializers.ValidationError("Email is required.")
        
        try:
            validate_email(value)
        except Exception as e:
            raise serializers.ValidationError("Please enter a valid email address.")
        
        normalized_email = User.objects.normalize_email(value).lower()
        
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return normalized_email
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value and value.strip():  
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
    
    def create(self, validated_data):
        """Create user with profile and proper role assignment"""
        profile_picture = validated_data.pop('profile_picture', None)
        enable_mfa = validated_data.pop('enable_mfa', False)
        validated_data.pop('confirm_password', None)
        validated_data.pop('terms_accepted', None)
        
        try:
            # Force CLIENT user type for security
            validated_data['user_type'] = 'CLIENT'
            
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                phone_number=validated_data.get('phone_number', ''),
                user_type='CLIENT',
                mfa_enabled=False  # Never enable MFA during registration
            )
            
            # If user requested MFA, mark setup as pending
            if enable_mfa:
                user.mark_mfa_setup_pending()
                logger.info(f"MFA setup requested for new user: {user.email}")
            
            # Create user profile
            UserProfile.objects.create(
                user=user,
                profile_picture=profile_picture
            )
            
            logger.info(f"New CLIENT user registered: {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"User registration failed: {str(e)}")
            raise serializers.ValidationError("Registration failed. Please try again.")
        


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Separate serializer for admin-created users with elevated privileges"""
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    user_type = serializers.ChoiceField(choices=User.USER_TYPES, required=True)
    roles = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of role IDs to assign to the user"
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'user_type', 'roles', 'is_verified'
        ]
        extra_kwargs = {
            'first_name': {'required': True, 'min_length': 2},
            'last_name': {'required': True, 'min_length': 2},
            'is_verified': {'default': True}
        }

    def validate(self, data):
        """Cross-field validation"""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        
        try:
            validate_password(data['password'])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return data

    def validate_roles(self, value):
        """Validate that all role IDs exist"""
        if value:
            existing_roles = Role.objects.filter(id__in=value, is_active=True)
            if len(existing_roles) != len(value):
                raise serializers.ValidationError("One or more roles do not exist or are inactive")
        return value

    def create(self, validated_data):
        """Create user with admin privileges and role assignment"""
        role_ids = validated_data.pop('roles', [])
        validated_data.pop('confirm_password', None)
        
        try:
            user = User.objects.create_user(**validated_data)
            
            # Assign roles if provided
            if role_ids:
                roles = Role.objects.filter(id__in=role_ids, is_active=True)
                for role in roles:
                    user.assign_role(role, assigned_by=self.context['request'].user)
            
            # Create user profile
            UserProfile.objects.create(user=user)
            
            logger.info(f"Admin created user: {user.email} with type: {user.user_type}")
            return user
            
        except Exception as e:
            logger.error(f"Admin user creation failed: {str(e)}")
            raise serializers.ValidationError("User creation failed. Please try again.")

        

class UserProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    full_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id','email', 'first_name', 'last_name','full_name', 'phone_number', 'user_type','profile_picture', 'profile_picture_url', 'company', 'job_title', 
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
    backup_codes_acknowledged = serializers.BooleanField(required=False)
    
    def validate(self, data):
        enable = data.get("enable")
        acknowledged = data.get("backup_codes_acknowledged", False)

        if enable and acknowledged:
            if not self.context['request'].user.mfa_enabled:
                raise serializers.ValidationError("MFA must be enabled before acknowledging backup codes.")
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
        normalized_email = User.objects.normalize_email(value).lower()
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
        
        if hasattr(self, 'instance') and self.instance:
            if self.instance.is_password_expired():
                pass
        
        return validated_data
