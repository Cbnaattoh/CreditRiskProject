from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from .managers import CustomUserManager
from django.utils import timezone



class User(AbstractUser):
    USER_TYPES = (
        ('ADMIN', 'Administrator'),
        ('ANALYST', 'Risk Analyst'),
        ('AUDITOR', 'Compliance Auditor'),
        ('CLIENT', 'Client User'),
    )

    username = None
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    is_verified = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=100, blank=True)
    last_password_change = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def clean(self):
        """Validate the model before saving"""
        super().clean()
        if not self.email:
            raise ValidationError("Email is required")
        self.email = self.__class__.objects.normalize_email(self.email)
    
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

    def __str__(self):
        return self.email 
        


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    company = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    
    def __str__(self):
        return f"{self.user.email}'s Profile"
    

class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=255)
    session_key = models.CharField(max_length=40, blank=True, null=True)
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    was_successful = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Login Histories"
        ordering = ['-login_time']
    
    def __str__(self):
        return f"{self.user.email} - {self.login_time}"