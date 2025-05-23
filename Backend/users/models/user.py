from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django_otp.plugins.otp_totp.models import TOTPDevice
from datetime import datetime, timedelta
from django.conf import settings
import os
from .user_manager import CustomUserManager

def profile_picture_upload_path(instance, filename):
    """
    Returns the upload path for user profile pictures.
    
    Format: users/<user_id>/profile_pictures/<filename>
    """
    return os.path.join('users', str(instance.id), 'profile_pictures', filename)

class User(AbstractUser):
    """
    Custom user model for RiskGuard Pro that extends Django's AbstractUser.
    Uses email as the primary identifier instead of username.
    """

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="custom_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="custom_user_set",
        related_query_name="user",
    )
    
    # ======================
    # Authentication Fields
    # ======================
    username = None  # Remove username field
    email = models.EmailField(_('email address'), unique=True)
    password = models.CharField(_('password'), max_length=128)
    last_login = models.DateTimeField(_('last login'), blank=True, null=True)
    
    # ======================
    # Personal Information
    # ======================
    first_name = models.CharField(_('first name'), max_length=150, blank=False)
    last_name = models.CharField(_('last name'), max_length=150, blank=False)
    date_of_birth = models.DateField(null=True, blank=True)
    
    class Gender(models.TextChoices):
        MALE = 'M', _('Male')
        FEMALE = 'F', _('Female')
        OTHER = 'O', _('Other')
        PREFER_NOT_TO_SAY = 'P', _('Prefer not to say')
    
    gender = models.CharField(
        max_length=1,
        choices=Gender.choices,
        blank=True
    )
    
    # ======================
    # Contact Information
    # ======================
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=_("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True
    )
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # ======================
    # Professional Information
    # ======================
    job_title = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=100, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    
    # ======================
    # Profile Settings
    # ======================
    profile_picture = models.ImageField(
        upload_to=profile_picture_upload_path,
        blank=True,
        null=True
    )
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')
    
    class Theme(models.TextChoices):
        LIGHT = 'light', _('Light')
        DARK = 'dark', _('Dark')
        SYSTEM = 'system', _('System Default')
    
    theme_preference = models.CharField(
        max_length=10,
        choices=Theme.choices,
        default=Theme.LIGHT
    )
    
    # ======================
    # Security Fields
    # ======================
    is_2fa_enabled = models.BooleanField(default=False)
    last_password_change = models.DateTimeField(auto_now_add=True)
    security_question = models.CharField(max_length=200, blank=True)
    security_answer = models.CharField(max_length=200, blank=True)
    
    # ======================
    # Status Flags
    # ======================
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    login_attempts = models.PositiveIntegerField(default=0)
    
    # ======================
    # User Types
    # ======================
    class UserType(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrator')
        USER = 'USER', _('Standard User')
        ANALYST = 'ANALYST', _('Risk Analyst')
        AUDITOR = 'AUDITOR', _('Compliance Auditor')
    
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.USER
    )
    
    # ======================
    # Timestamps
    # ======================
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    # ======================
    # Financial Risk Fields
    # ======================
    risk_score = models.FloatField(null=True, blank=True)
    credit_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    risk_category = models.CharField(max_length=50, blank=True)
    
    # ======================
    # Social Authentication
    # ======================
    social_auth_provider = models.CharField(max_length=50, blank=True)
    social_auth_uid = models.CharField(max_length=255, blank=True)
    
    # ======================
    # Metadata
    # ======================
    signup_ip = models.GenericIPAddressField(blank=True, null=True)
    last_ip = models.GenericIPAddressField(blank=True, null=True)
    
    # ======================
    # Notification Preferences
    # ======================
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    
    # ======================
    # GDPR Compliance
    # ======================
    data_processing_consent = models.BooleanField(default=False)
    marketing_consent = models.BooleanField(default=False)
    
    # ======================
    # Activity Tracking
    # ======================
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # ======================
    # Authentication Config
    # ======================
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = CustomUserManager()
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['user_type']),
            models.Index(fields=['risk_score']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['-date_joined']
    
    def __str__(self):
        """String representation of the user"""
        return f"{self.get_full_name()} ({self.email})"
    
    # ======================
    # Name Methods
    # ======================
    def get_full_name(self):
        """Returns the user's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        """Returns the user's short name (first name)"""
        return self.first_name
    
    def get_initials(self):
        """Returns the user's initials"""
        if self.first_name and self.last_name:
            return f"{self.first_name[0]}{self.last_name[0]}".upper()
        return "US"
    
    # ======================
    # Profile Picture Methods
    # ======================
    def get_profile_picture_url(self):
        """
        Returns the URL of the user's profile picture or a default avatar.
        
        Uses UI Avatars API as fallback if no profile picture is set.
        """
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        return f"https://ui-avatars.com/api/?name={self.get_initials()}&background=random"
    
    # ======================
    # 2FA Methods
    # ======================
    def enable_2fa(self):
        """Enables two-factor authentication for the user"""
        self.is_2fa_enabled = True
        self.save()
    
    def disable_2fa(self):
        """Disables two-factor authentication and removes TOTP devices"""
        self.is_2fa_enabled = False
        TOTPDevice.objects.filter(user=self).delete()
        self.save()
    
    def has_2fa_device(self):
        """Checks if the user has a confirmed TOTP device"""
        return TOTPDevice.objects.filter(user=self, confirmed=True).exists()
    
    # ======================
    # Risk Assessment Methods
    # ======================
    def get_risk_category(self):
        """Returns the user's risk category based on their risk score"""
        if not self.risk_score:
            return "Not Assessed"
        if self.risk_score >= 80:
            return "High Risk"
        elif self.risk_score >= 50:
            return "Medium Risk"
        return "Low Risk"
    
    # ======================
    # Account Security Methods
    # ======================
    def lock_account(self):
        """Locks the user's account due to too many failed login attempts"""
        self.is_locked = True
        self.save()
    
    def unlock_account(self):
        """Unlocks the user's account and resets login attempts"""
        self.is_locked = False
        self.login_attempts = 0
        self.save()
    
    def record_login_attempt(self, ip_address, success):
        """
        Records a login attempt and updates account status accordingly.
        
        Args:
            ip_address (str): IP address of the login attempt
            success (bool): Whether the login attempt was successful
        """
        from .user_activity import UserActivity
        
        # Log the activity
        UserActivity.objects.create(
            user=self,
            activity_type="LOGIN_ATTEMPT",
            ip_address=ip_address,
            metadata={"success": success}
        )
        
        if not success:
            # Increment failed attempts counter
            self.login_attempts += 1
            if self.login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                self.lock_account()
            self.save()
        else:
            # Reset on successful login
            self.login_attempts = 0
            self.last_login = datetime.now()
            self.last_ip = ip_address
            self.save()
    
    def is_password_expired(self):
        """Checks if the user's password has expired"""
        if self.is_superuser:
            return False  # Superusers don't have password expiration
        expiration_days = settings.PASSWORD_EXPIRATION_DAYS
        return datetime.now() > (self.last_password_change + timedelta(days=expiration_days))
    
    def change_password(self, new_password):
        """Updates the user's password and records the change timestamp"""
        self.set_password(new_password)
        self.last_password_change = datetime.now()
        self.save()