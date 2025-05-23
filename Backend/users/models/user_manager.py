from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of usernames.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password.
        
        Args:
            email (str): User's email address (required)
            password (str): User's password (optional)
            **extra_fields: Additional user attributes
            
        Returns:
            User: The created user instance
            
        Raises:
            ValueError: If email is not provided
        """
        if not email:
            raise ValueError(_("The Email field must be set"))
        
        # Normalize email address (lowercase domain part)
        email = self.normalize_email(email)
        
        # Set default values for new users
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", False)
        
        # Create user instance
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        
        # Log account creation activity
        from .user_activity import UserActivity
        UserActivity.objects.create(
            user=user,
            activity_type="ACCOUNT_CREATED",
            ip_address=extra_fields.get('signup_ip', None)
        )
        
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        
        Args:
            email (str): Superuser's email address
            password (str): Superuser's password
            **extra_fields: Additional superuser attributes
            
        Returns:
            User: The created superuser instance
        """
        # Set superuser defaults
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        
        # Validate staff/superuser status
        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
            
        return self.create_user(email, password, **extra_fields)