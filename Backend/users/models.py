from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator, MinLengthValidator
from django.core.exceptions import ValidationError
from .managers import CustomUserManager
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import hashlib


class Permission(models.Model):
    """Custom permission model for granular access control"""
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='custom_permission_set'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['codename']),

        ]

    def __str__(self):
        return f"{self.name}"


    
class Role(models.Model):
    """Role model that groups permissions"""
    name = models.CharField(max_length=50,unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Is this the default role for new users?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name', 'is_active']),
        ]

    def __str__(self):
        return self.name
    
    def add_permission(self, permission):
        """"Add permission to role"""
        self.permissions.add(permission)

    def remove_permission(self, permission):
        """Remove permission from role"""
        self.permissions.remove(permission)

    def has_permission(self, permission_codename):
        """Check if role has specific permission"""
        return self.permission.filter(codename=permission_codename).exists()
    

    
class UserRole(models.Model):
    """Many-to-many relationship between User and Role with additional context"""
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_assigned'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'role']
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.role.name}"
    
    @property
    def is_expired(self):
        """Check if role assignment has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    



class User(AbstractUser):
    USER_TYPES = (
        ('ADMIN', 'Administrator'),
        ('ANALYST', 'Risk Analyst'),
        ('AUDITOR', 'Compliance Auditor'),
        ('CLIENT', 'Client User'),
    )

    # Roles that can be selected during registration
    REGISTRATION_ALLOWED_ROLES = ['CLIENT']

    # Role that require admin assignment
    ADMIN_ONLY_ROLES = ['ADMIN', 'ANALYST', 'AUDITOR']

    username = None
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150, validators=[MinLengthValidator(2)])
    last_name = models.CharField(_('last name'), max_length=150, validators=[MinLengthValidator(2)])
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    phone_regex = RegexValidator(
        regex=r'^\+\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Country code is required."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    is_verified = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=100, blank=True)
    mfa_setup_pending = models.BooleanField(default=False, help_text="True if user requested MFA but hasn't completed setup")
    mfa_completed_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when MFA setup was completed")
    backup_codes = models.JSONField(default=list, blank=True)
    last_password_change = models.DateTimeField(auto_now_add=True)
    password_change_required = models.BooleanField(default=False, help_text="True if user must change password on next login")
    is_temp_password = models.BooleanField(default=False, help_text="True if current password is temporary")
    created_by_admin = models.BooleanField(default=False, help_text="True if user was created by admin")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def clean(self):
        """Validate the model before saving"""
        super().clean()
        if not self.email:
            raise ValidationError("Email is required")
        self.email = self.__class__.objects.normalize_email(self.email).lower()

    
    def save(self, *args, **kwargs):
        """Override save to ensure email validation and default role assignment"""
        self.clean()
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            self.assign_default_role()
    
    def assign_default_role(self):
        """"Assign default role based on user type"""
        if not self.user_roles.filter(is_active=True).exists():
            try:
                role_mapping ={
                    'CLIENT': 'Client User',
                    'ANALYST': 'Risk Analyst',
                    'ADMIN': 'Administrator',
                    'AUDITOR': 'Compliance Auditor'
                }
                role_name = role_mapping.get(self.user_type)
                if role_name:
                    role = Role.objects.get(name=role_name, is_active=True)
                    self.assign_role(role)
                else:
                    default_role = Role.objects.filter(is_default=True, is_active=True).first()
                    if default_role:
                        self.assign_role(default_role)
            except Role.DoesNotExist:
                raise ValidationError(f"Default role for user type '{self.user_type}' does not exist")

    def set_password(self, raw_password, is_temporary=False):
        """Override to handle temporary passwords"""
        # Allow Django's security feature for non-existent users (no email + no pk)
        # This happens during authentication when user doesn't exist (timing attack prevention)
        if not self.email and self.pk is not None:
            raise ValidationError("Cannot set password without email")
        super().set_password(raw_password)
        # Only update for real users (with email and pk)
        if self.email and self.pk is not None:
            self.last_password_change = timezone.now()
            self.is_temp_password = is_temporary
            self.password_change_required = is_temporary

    def is_password_expired(self):
        """Check if password has expired"""
        if not self.last_password_change:
            return True
        expiration_days = getattr(settings, 'PASSWORD_EXPIRATION_DAYS', 90)
        return (timezone.now() - self.last_password_change).days > expiration_days
    
    @staticmethod
    def generate_temporary_password():
        """Generate a secure temporary password"""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(12))
    
    def set_temporary_password(self):
        """Set a temporary password for the user"""
        temp_password = self.generate_temporary_password()
        self.set_password(temp_password, is_temporary=True)
        return temp_password
    
    def get_roles(self):
        """Get all active, non-expired roles for user"""
        from django.db.models import Q

        return Role.objects.filter(
            userrole__user=self,
            userrole__is_active=True,   
        ).filter(
            Q(userrole__expires_at__isnull=True) | 
            Q(userrole__expires_at__gt=timezone.now())
        ).distinct()
    
    def get_permissions(self):
        """Get all permissions from user's active roles"""
        roles = self.get_roles()
        if not roles.exists():
            return Permission.objects.none()
        
        # Get all permissions from all active roles
        permission_ids = set()
        for role in roles:
            permission_ids.update(role.permissions.values_list('id', flat=True))
        
        return Permission.objects.filter(id__in=permission_ids)
    
    def has_permission(self, permission_codename):
        """Check if user has specific permission"""
        if self.is_superuser:
            return True
            
        return self.get_permissions().filter(codename=permission_codename).exists()
    
    def has_role(self, role_name):
        """Check if user has specific role"""
        return self.get_roles().filter(name=role_name).exists()
    
    def assign_role(self, role, assigned_by=None, expires_at=None):
        """Assign role to user"""
        user_role, created = UserRole.objects.get_or_create(
            user=self,
            role=role,
            defaults={
                'assigned_by': assigned_by,
                'expires_at': expires_at,
                'is_active': True
            }
        )
        if not created and not user_role.is_active:
            user_role.is_active = True
            user_role.assigned_by = assigned_by
            user_role.expires_at = expires_at
            user_role.assigned_at = timezone.now()
            user_role.save()
        return user_role
    
    def remove_role(self, role):
        """Remove role from user"""
        UserRole.objects.filter(user=self, role=role, is_active=True).update(is_active=False)
    
    def can_assign_role(self, role_name):
        """Check if this user can assign a specific role to others"""
        # Only admins or users with specific permissions can assign roles
        return (
            self.is_superuser or 
            self.has_permission('manage_user_roles') or
            self.has_permission('role_assign')
        )
    
    @property
    def is_mfa_fully_configured(self):
        """Check if MFA is fully configured"""
        return self.mfa_enabled and bool(self.mfa_secret) and self.mfa_completed_at is not None
    
    @property
    def requires_mfa_setup(self):
        """Check if user needs to complete MFA setup"""
        return self.mfa_setup_pending and not self.is_mfa_fully_configured
    
    def mark_mfa_setup_pending(self):
        """Mark user as needing MFA setup"""
        self.mfa_setup_pending = True
        self.save(update_fields=['mfa_setup_pending'])
    
    def complete_mfa_setup(self):
        """Mark MFA setup as completed"""
        from django.utils import timezone
        self.mfa_setup_pending = False
        self.mfa_completed_at = timezone.now()
        self.save(update_fields=['mfa_setup_pending', 'mfa_completed_at'])
    
    def reset_mfa(self):
        """Reset MFA configuration"""
        self.mfa_enabled = False
        self.mfa_secret = ''
        self.mfa_setup_pending = False
        self.mfa_completed_at = None
        self.backup_codes = []
        self.save(update_fields=['mfa_enabled', 'mfa_secret', 'mfa_setup_pending', 'mfa_completed_at', 'backup_codes'])
    
    def __str__(self):
        return self.email


# Permission audit trail
class PermissionLog(models.Model):
    """Log permission checks for audit purposes"""
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    permission_codename = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=100, blank=True)
    resource_id = models.CharField(max_length=100, blank=True)
    action = models.CharField(max_length=50)  # 'granted', 'denied'
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['permission_codename', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.permission_codename} - {self.action}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    company = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True, max_length=500)
    timezone = models.CharField(max_length=50, default='UTC')
    
    def __str__(self):
        return f"{self.user.email}'s Profile"
    

class LoginHistory(models.Model):
    """ Login history tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=255, blank=True)
    was_successful = models.BooleanField()
    failure_reason = models.CharField(max_length=100, blank=True, null=True)
    login_timestamp = models.DateTimeField(default=timezone.now)
    session_duration = models.DurationField(null=True, blank=True)
    
    class Meta:
        ordering = ['-login_timestamp']
        indexes = [
            models.Index(fields=['user', 'login_timestamp']),
            models.Index(fields=['ip_address', 'login_timestamp']),
            models.Index(fields=['was_successful', 'login_timestamp']),
        ]
    
    def __str__(self):
        status = "Success" if self.was_successful else f"Failed ({self.failure_reason})"
        return f"{self.user.email} - {status} - {self.login_timestamp}"



