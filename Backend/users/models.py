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

    def __str__(self):
        return f"{self.name}"


    
class Role(models.Model):
    """Role model that groups permissions"""
    name = models.CharField(max_length=50,unique=True)
    decsription = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

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
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='user_role')
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
    
    def __str__(self):
        return f"{self.user.email} - {self.role.name}"
    
    @property
    def is_expired(self):
        """Check if role assignment has expired"""
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() > self.expires_at
        return False
    



class User(AbstractUser):
    USER_TYPES = (
        ('ADMIN', 'Administrator'),
        ('ANALYST', 'Risk Analyst'),
        ('AUDITOR', 'Compliance Auditor'),
        ('CLIENT', 'Client User'),
    )

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
    backup_codes = models.JSONField(default=list, blank=True)
    last_password_change = models.DateTimeField(auto_now_add=True)

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
        """Override save to ensure email validation"""
        self.clean()
        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        """Override to prevent saving with invalid data"""
        if not self.email:
            raise ValidationError("Cannot set password without email")
        super().set_password(raw_password)
        self.last_password_change = timezone.now()

    def is_password_expired(self):
        """Check if password has expired"""
        if not self.last_password_change:
            return True
        expiration_days = getattr(settings, 'PASSWORD_EXPIRATION_DAYS', 90)
        return (timezone.now() - self.last_password_change).days > expiration_days
    
    def get_roles(self):
        """Get all active roles for user"""
        from django.utils import timezone
        return Role.objects.filter(
            userrole__user=self,
            userrole__is_active=True,
            userrole__expires_at__isnull=True    
        ).union(
            Role.objects.filter(
                userrole__user=self,
                userrole__is_active=True,
                userrole__expires_at__gt=timezone.now()
            )
        )
    
    def get_permissions(self):
        """Get all permissions from user's roles"""
        roles = self.get_roles()
        permissions = Permission.objects.none()
        for role in roles:
            permissions = permissions.union(role.permissions.all())
        return permissions
    
    def has_permission(self, permission_codename):
        """Check if user has specific permission"""
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
                'expires_at': expires_at
            }
        )
        if not created:
            user_role.is_active = True
            user_role.expires_at = expires_at
            user_role.save()
        return user_role
    
    def remove_role(self, role):
        """Remove role from user"""
        UserRole.objects.filter(user=self, role=role).update(is_active=False)
    
    @property
    def is_mfa_fully_configured(self):
        return self.mfa_enabled and bool(self.mfa_secret)

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



