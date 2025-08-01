# Settings Configuration for Enhanced MFA Security

## Required Changes to Django Settings

Add the following configurations to your Django settings file:

### 1. Add MFA Middleware to MIDDLEWARE

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    # Add MFA enforcement middleware AFTER authentication
    'users.middleware.MFAEnforcementMiddleware',
    
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Your existing custom middleware
    'security.middleware.BehavioralMiddleware',
    'users.middleware.PasswordExpirationMiddleware',
]
```

### 2. MFA Configuration Settings

```python
# MFA Configuration
MFA_ISSUER_NAME = 'RiskGuard Pro'
MFA_ENFORCE_FOR_SENSITIVE_OPERATIONS = True

# Token Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': (
        'rest_framework_simplejwt.tokens.AccessToken',
        'users.tokens.MFASetupToken',  # Add our custom token
        'users.tokens.FullAccessToken',
    ),
}

# Security Settings
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_DURATION = 3600  # 1 hour in seconds
PASSWORD_EXPIRATION_DAYS = 90
```

### 3. Logging Configuration

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'mfa_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/mfa_security.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'users.middleware': {
            'handlers': ['mfa_file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'users.permissions': {
            'handlers': ['mfa_file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'users.tokens': {
            'handlers': ['mfa_file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## Migration Instructions

1. **Run the migrations:**
   ```bash
   python manage.py migrate users
   ```

2. **Create logs directory:**
   ```bash
   mkdir -p logs
   ```

3. **Test the configuration:**
   ```bash
   python manage.py check
   ```

## Optional: Less Restrictive Configuration

If you want to start with logging only (no blocking), use the lighter middleware:

```python
MIDDLEWARE = [
    # ... other middleware ...
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    # Use the lighter middleware for logging only
    'users.middleware.MFAScopeValidationMiddleware',
    
    # ... rest of middleware ...
]
```

## Environment Variables

Add these to your .env file:

```env
# MFA Settings
MFA_ISSUER_NAME=RiskGuard Pro
MFA_ENFORCE_STRICT=True

# Security Settings  
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=3600
PASSWORD_EXPIRATION_DAYS=90
```