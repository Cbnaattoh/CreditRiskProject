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
    # Verification fields - Dual verification system (email + phone)
    # Currently only email verification is active due to budget constraints
    # Phone verification is ready to enable when budget allows
    is_verified = models.BooleanField(default=False, help_text="True when required verifications are complete (currently email only)")
    email_verified = models.BooleanField(default=False, help_text="True when email is verified")
    phone_verified = models.BooleanField(default=False, help_text="True when phone number is verified (ready but disabled)")
    email_verified_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when email was verified")
    phone_verified_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when phone was verified")
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=100, blank=True)
    mfa_setup_pending = models.BooleanField(default=False, help_text="True if user requested MFA but hasn't completed setup")
    mfa_completed_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when MFA setup was completed")
    backup_codes = models.JSONField(default=list, blank=True)
    last_password_change = models.DateTimeField(auto_now_add=True)
    password_change_required = models.BooleanField(default=False, help_text="True if user must change password on next login")
    is_temp_password = models.BooleanField(default=False, help_text="True if current password is temporary")
    created_by_admin = models.BooleanField(default=False, help_text="True if user was created by admin")
    
    # Ghana Card fields
    ghana_card_number = models.CharField(
        max_length=20, 
        blank=True, 
        help_text="Ghana Card ID number",
        db_index=True  # Add index for faster lookups
    )
    ghana_card_front_image = models.ImageField(upload_to='ghana_cards/front/', blank=True, null=True, help_text="Ghana Card front image (with photo and name)")
    ghana_card_back_image = models.ImageField(upload_to='ghana_cards/back/', blank=True, null=True, help_text="Ghana Card back image (with ID number and address)")
    ghana_card_name_verified = models.BooleanField(default=False, help_text="True if name on Ghana Card matches profile name")
    ghana_card_number_verified = models.BooleanField(default=False, help_text="True if Ghana Card number was successfully extracted")
    ghana_card_extracted_name = models.CharField(max_length=300, blank=True, help_text="Name extracted from Ghana Card front using OCR")
    ghana_card_extracted_number = models.CharField(max_length=20, blank=True, help_text="ID number extracted from Ghana Card back using OCR")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def clean(self):
        """Validate the model before saving"""
        super().clean()
        if not self.email:
            raise ValidationError("Email is required")
        self.email = self.__class__.objects.normalize_email(self.email).lower()
        
        # Validate Ghana Card number uniqueness
        if self.ghana_card_number:
            # Normalize Ghana Card number to uppercase
            self.ghana_card_number = self.ghana_card_number.upper().strip()
            
            # Check for duplicate Ghana Card numbers
            existing_user = User.objects.filter(
                ghana_card_number=self.ghana_card_number
            ).exclude(pk=self.pk).first()
            
            if existing_user:
                raise ValidationError({
                    'ghana_card_number': f'A user with Ghana Card number {self.ghana_card_number} already exists.'
                })

    
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

    def verify_email(self):
        """Mark email as verified and update overall verification status"""
        from django.utils import timezone
        
        self.email_verified = True
        self.email_verified_at = timezone.now()
        self._update_verification_status()
        self.save(update_fields=['email_verified', 'email_verified_at', 'is_verified'])
        
    def verify_phone(self):
        """Mark phone as verified and update overall verification status"""
        from django.utils import timezone
        
        self.phone_verified = True
        self.phone_verified_at = timezone.now()
        self._update_verification_status()
        self.save(update_fields=['phone_verified', 'phone_verified_at', 'is_verified'])
    
    def _update_verification_status(self):
        """Update overall verification status based on email and phone verification"""
        # Currently only email verification required (phone verification ready but disabled due to budget)
        # When budget allows, change this to: self.email_verified and self.phone_verified
        self.is_verified = self.email_verified  # and self.phone_verified
    
    def is_fully_verified(self):
        """Check if user has completed all verification requirements"""
        # Currently only email verification required (phone ready but disabled due to budget)
        return self.email_verified  # and self.phone_verified
    
    def get_verification_status(self):
        """Get detailed verification status"""
        return {
            'is_fully_verified': self.is_fully_verified(),
            'email_verified': self.email_verified,
            'phone_verified': self.phone_verified,
            'email_verified_at': self.email_verified_at,
            'phone_verified_at': self.phone_verified_at,
            'pending_verifications': [
                'email' if not self.email_verified else None,
                'phone' if not self.phone_verified else None,
            ]
        }


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
    
    # Extended profile fields
    date_of_birth = models.DateField(null=True, blank=True)
    phone_secondary = models.CharField(max_length=17, blank=True, help_text="Secondary phone number")
    address = models.TextField(blank=True, max_length=500)
    
    # Professional links (relevant for credit assessment)
    linkedin_url = models.URLField(blank=True, help_text="LinkedIn profile URL")
    portfolio_url = models.URLField(blank=True, help_text="Professional website/portfolio URL")
    
    # Emergency contact information
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=17, blank=True)
    
    # Profile analytics
    profile_completion_score = models.PositiveSmallIntegerField(default=0, help_text="Profile completion percentage")
    last_profile_update = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email}'s Profile"
    
    def calculate_completion_score(self):
        """Calculate profile completion percentage"""
        # Core fields (weighted more heavily)
        core_fields = [
            self.profile_picture, self.company, self.job_title, self.bio
        ]
        # Extended fields
        extended_fields = [
            self.department, self.date_of_birth, self.phone_secondary, self.address,
            self.emergency_contact_name, self.emergency_contact_phone
        ]
        # Optional professional fields (bonus points)
        professional_fields = [
            self.linkedin_url, self.portfolio_url
        ]
        
        # Calculate completion score with weights
        core_completed = sum(1 for field in core_fields if field)
        extended_completed = sum(1 for field in extended_fields if field)
        professional_completed = sum(1 for field in professional_fields if field)
        
        # Weighted scoring: core fields = 60%, extended = 30%, professional = 10%
        core_score = (core_completed / len(core_fields)) * 60
        extended_score = (extended_completed / len(extended_fields)) * 30
        professional_score = (professional_completed / len(professional_fields)) * 10
        
        score = int(core_score + extended_score + professional_score)
        
        if score != self.profile_completion_score:
            self.profile_completion_score = score
            self.save(update_fields=['profile_completion_score'])
        
        return score
    

class UserPreferences(models.Model):
    """Store user preferences and settings"""
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
        ('ja', 'Japanese'),
        ('zh', 'Chinese'),
    ]
    
    NOTIFICATION_FREQUENCY_CHOICES = [
        ('instant', 'Instant'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('never', 'Never'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    
    # Appearance preferences
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='light')
    compact_view = models.BooleanField(default=False)
    animations_enabled = models.BooleanField(default=True)
    sidebar_collapsed = models.BooleanField(default=False)
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    notification_frequency = models.CharField(max_length=10, choices=NOTIFICATION_FREQUENCY_CHOICES, default='instant')
    security_alerts = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    
    # System preferences
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    date_format = models.CharField(max_length=20, default='YYYY-MM-DD')
    time_format = models.CharField(max_length=10, default='24h', choices=[('12h', '12 Hour'), ('24h', '24 Hour')])
    auto_save = models.BooleanField(default=True)
    session_timeout = models.PositiveIntegerField(default=30, help_text="Session timeout in minutes")
    
    # Privacy preferences
    profile_visibility = models.CharField(max_length=20, default='private', 
                                        choices=[('public', 'Public'), ('private', 'Private'), ('team', 'Team Only')])
    activity_tracking = models.BooleanField(default=True)
    data_sharing = models.BooleanField(default=False)
    
    # Advanced preferences (JSON for flexibility)
    custom_settings = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['theme']),
            models.Index(fields=['language']),
        ]
    
    def __str__(self):
        return f"{self.user.email}'s Preferences"
    
    def get_preference(self, key, default=None):
        """Get a custom preference value"""
        return self.custom_settings.get(key, default)
    
    def set_preference(self, key, value):
        """Set a custom preference value"""
        self.custom_settings[key] = value
        self.save(update_fields=['custom_settings'])


class UserSession(models.Model):
    """Track active user sessions for security and management"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True, db_index=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=500, blank=True)
    device_type = models.CharField(max_length=50, blank=True)  # mobile, desktop, tablet
    browser = models.CharField(max_length=100, blank=True)
    os = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)  # City, Country
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    terminated_by_user = models.BooleanField(default=False)
    
    # Security flags
    is_suspicious = models.BooleanField(default=False)
    security_score = models.PositiveSmallIntegerField(default=100)  # 0-100
    
    class Meta:
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_key']),
            models.Index(fields=['ip_address', 'created_at']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.device_type} - {self.created_at}"
    
    def is_expired(self):
        """Check if session is expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def terminate(self, by_user=False):
        """Terminate the session"""
        self.is_active = False
        self.terminated_by_user = by_user
        self.save(update_fields=['is_active', 'terminated_by_user'])
    
    def calculate_security_score(self):
        """Calculate security score based on various factors"""
        score = 100
        
        # Reduce score for suspicious activities
        if self.is_suspicious:
            score -= 30
        
        # Reduce score for old sessions
        days_active = (timezone.now() - self.created_at).days
        if days_active > 30:
            score -= min(20, days_active)
        
        # Reduce score for unknown locations (this would need geolocation service)
        if not self.location:
            score -= 5
        
        self.security_score = max(0, score)
        return self.security_score


class SecurityEvent(models.Model):
    """Log security events for audit and monitoring"""
    EVENT_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('password_change', 'Password Change'),
        ('mfa_enable', 'MFA Enabled'),
        ('mfa_disable', 'MFA Disabled'),
        ('profile_update', 'Profile Updated'),
        ('preferences_update', 'Preferences Updated'),
        ('suspicious_activity', 'Suspicious Activity'),
        ('session_terminated', 'Session Terminated'),
        ('permission_granted', 'Permission Granted'),
        ('permission_denied', 'Permission Denied'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_events')
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS, default='low')
    description = models.TextField()
    
    # Context information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    session = models.ForeignKey(UserSession, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_events')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['event_type', 'created_at']),
            models.Index(fields=['severity', 'resolved']),
            models.Index(fields=['ip_address', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.event_type} - {self.severity}"


class LoginHistory(models.Model):
    """ Enhanced login history tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=500, blank=True)
    device_info = models.JSONField(default=dict, blank=True)  # Store parsed device information
    location = models.CharField(max_length=200, blank=True)
    
    was_successful = models.BooleanField()
    failure_reason = models.CharField(max_length=100, blank=True, null=True)
    mfa_used = models.BooleanField(default=False)
    
    login_timestamp = models.DateTimeField(default=timezone.now)
    logout_timestamp = models.DateTimeField(null=True, blank=True)
    session_duration = models.DurationField(null=True, blank=True)
    session = models.ForeignKey(UserSession, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Risk assessment
    risk_score = models.PositiveSmallIntegerField(default=0)  # 0-100
    is_suspicious = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-login_timestamp']
        indexes = [
            models.Index(fields=['user', 'login_timestamp']),
            models.Index(fields=['ip_address', 'login_timestamp']),
            models.Index(fields=['was_successful', 'login_timestamp']),
            models.Index(fields=['risk_score']),
            models.Index(fields=['is_suspicious']),
        ]
    
    def __str__(self):
        status = "Success" if self.was_successful else f"Failed ({self.failure_reason})"
        return f"{self.user.email} - {status} - {self.login_timestamp}"
    
    def calculate_session_duration(self):
        """Calculate and update session duration"""
        if self.logout_timestamp and self.login_timestamp:
            self.session_duration = self.logout_timestamp - self.login_timestamp
            return self.session_duration
        return None



