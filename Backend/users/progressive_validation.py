import re
import time
import hashlib
import logging
import asyncio
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from functools import wraps

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings

from .models import User

logger = logging.getLogger(__name__)

# Performance monitoring decorator
def monitor_performance(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        start_time = time.time()
        request_id = request.headers.get('X-Request-ID', 'unknown')
        
        try:
            response = func(request, *args, **kwargs)
            duration = (time.time() - start_time) * 1000
            
            # Log performance metrics
            logger.info(f"[PERF] {func.__name__} - {request_id} - {duration:.2f}ms")
            
            # Add performance headers
            if hasattr(response, 'headers'):
                response.headers['X-Processing-Time-MS'] = f"{duration:.2f}"
                response.headers['X-Request-ID'] = request_id
            
            return response
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            logger.error(f"[ERROR] {func.__name__} - {request_id} - {duration:.2f}ms - {str(e)}")
            raise
    
    return wrapper

# Rate limiting decorator
def rate_limit(max_requests: int = 10, window_seconds: int = 60):
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Get client identifier
            client_ip = get_client_ip(request)
            cache_key = f"rate_limit:{func.__name__}:{client_ip}"
            
            # Get current request count
            current_count = cache.get(cache_key, 0)
            
            if current_count >= max_requests:
                return Response({
                    'error': 'Rate limit exceeded. Please try again later.',
                    'retry_after_seconds': window_seconds
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Increment counter
            cache.set(cache_key, current_count + 1, window_seconds)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator

def get_client_ip(request):
    """Extract client IP for rate limiting"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class ValidationCache:
    """Advanced caching system for validation results"""
    
    @staticmethod
    def get_cache_key(validation_type: str, data: str) -> str:
        """Generate cache key for validation results"""
        data_hash = hashlib.md5(data.encode()).hexdigest()
        return f"validation:{validation_type}:{data_hash}"
    
    @staticmethod
    def cache_result(cache_key: str, result: dict, timeout: int = 300):
        """Cache validation result with timestamp"""
        cache_data = {
            'result': result,
            'timestamp': timezone.now().isoformat(),
            'ttl': timeout
        }
        cache.set(cache_key, cache_data, timeout)
    
    @staticmethod
    def get_cached_result(cache_key: str) -> Optional[dict]:
        """Retrieve cached validation result"""
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data['result']
        return None

class SecurityChecker:
    """Advanced security validation system"""
    
    @staticmethod
    def check_email_security(email: str) -> Dict[str, any]:
        """Comprehensive email security analysis"""
        security_score = 100
        flags = []
        warnings = []
        
        # Check for temporary email domains
        temp_domains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email', 'temp-mail.org'
        ]
        
        domain = email.split('@')[1].lower() if '@' in email else ''
        
        if domain in temp_domains:
            security_score -= 50
            flags.append('temporary_email')
            warnings.append('Temporary email addresses are not recommended for security')
        
        # Check for suspicious patterns
        if re.search(r'\d{4,}', email):  # Many consecutive digits
            security_score -= 10
            warnings.append('Email contains many consecutive numbers')
        
        # Check domain reputation (simplified)
        trusted_domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
        if domain not in trusted_domains and not domain.endswith('.edu') and not domain.endswith('.gov'):
            security_score -= 5
        
        return {
            'security_score': max(0, security_score),
            'flags': flags,
            'warnings': warnings,
            'domain_reputation': 'trusted' if domain in trusted_domains else 'unknown'
        }
    
    @staticmethod
    def analyze_password_entropy(password: str) -> float:
        """Calculate password entropy for strength assessment"""
        if not password:
            return 0.0
        
        # Character set sizes
        lowercase = any(c.islower() for c in password)
        uppercase = any(c.isupper() for c in password)
        digits = any(c.isdigit() for c in password)
        special = any(not c.isalnum() for c in password)
        
        charset_size = 0
        if lowercase:
            charset_size += 26
        if uppercase:
            charset_size += 26
        if digits:
            charset_size += 10
        if special:
            charset_size += 32  # Common special characters
        
        # Calculate entropy
        import math
        entropy = len(password) * math.log2(charset_size) if charset_size > 0 else 0
        return entropy
    
    @staticmethod
    def estimate_crack_time(entropy: float) -> str:
        """Estimate time to crack password based on entropy"""
        if entropy < 28:
            return "Less than 1 minute"
        elif entropy < 35:
            return "Several minutes"
        elif entropy < 44:
            return "Several hours"
        elif entropy < 59:
            return "Several years"
        elif entropy < 65:
            return "Centuries"
        else:
            return "Millions of years"

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
@monitor_performance
@rate_limit(max_requests=20, window_seconds=60)
def validate_step1_basic_info(request):
    try:
        data = request.data
        errors = {}
        warnings = {}
        field_scores = {}
        suggestions = {}
        
        # Check cache first
        cache_data = f"{data.get('email', '')}{data.get('phone_number', '')}"
        cache_key = ValidationCache.get_cache_key('step1', cache_data)
        cached_result = ValidationCache.get_cached_result(cache_key)
        
        if cached_result:
            logger.info("[CACHE HIT] Step 1 validation served from cache")
            return Response(cached_result)
        
        # Validate email with security analysis
        email = data.get('email', '').strip().lower()
        if not email:
            errors['email'] = ['Email address is required']
            field_scores['email'] = 0
        else:
            try:
                validate_email(email)
                field_scores['email'] = 85
                
                # Advanced security analysis
                security_analysis = SecurityChecker.check_email_security(email)
                field_scores['email'] = security_analysis['security_score']
                
                if security_analysis['warnings']:
                    warnings['email'] = security_analysis['warnings']
                
                if security_analysis['flags']:
                    if 'temporary_email' in security_analysis['flags']:
                        suggestions['email'] = 'Consider using a permanent email address for better security'
                
                # Check email uniqueness with optimized query
                if User.objects.filter(email__iexact=email).exists():
                    errors['email'] = ['An account with this email already exists']
                    suggestions['email'] = 'Try logging in instead, or use a different email address'
                    field_scores['email'] = 0
                
            except ValidationError:
                errors['email'] = ['Please enter a valid email address']
                field_scores['email'] = 0
                suggestions['email'] = 'Example: user@example.com'
        
        # Advanced phone number validation
        phone = data.get('phone_number', '').strip()
        if not phone:
            errors['phone_number'] = ['Phone number is required']
            field_scores['phone_number'] = 0
        else:
            # Advanced phone formatting and validation
            clean_phone = re.sub(r'[\s\-\(\)\+]', '', phone)
            
            # International format validation
            if phone.startswith('+'):
                # International format
                if not re.match(r'^\+[1-9]\d{1,14}$', phone.replace(' ', '').replace('-', '')):
                    errors['phone_number'] = ['Please enter a valid international phone number']
                    field_scores['phone_number'] = 0
                else:
                    field_scores['phone_number'] = 95
            else:
                # Local format validation (Ghana specific)
                if not re.match(r'^0[2-9]\d{8}$', clean_phone):
                    errors['phone_number'] = ['Please enter a valid Ghana phone number (10 digits starting with 0)']
                    field_scores['phone_number'] = 60
                    suggestions['phone_number'] = 'Example: 0241234567 or +233241234567'
                else:
                    field_scores['phone_number'] = 90
            
            # Check for duplicate phone numbers
            if 'phone_number' not in errors and User.objects.filter(phone_number=phone).exists():
                warnings['phone_number'] = ['This phone number is already associated with another account']
                field_scores['phone_number'] -= 10
        
        # Terms acceptance validation
        terms_accepted = data.get('terms_accepted', False)
        if not terms_accepted:
            errors['terms_accepted'] = ['You must accept the terms and conditions to continue']
            field_scores['terms_accepted'] = 0
        else:
            field_scores['terms_accepted'] = 100
        
        # Calculate overall validation score
        total_score = sum(field_scores.values()) / len(field_scores) if field_scores else 0
        
        result = {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'suggestions': suggestions,
            'field_scores': field_scores,
            'overall_score': round(total_score, 2),
            'message': 'Basic information validated successfully' if len(errors) == 0 else 'Please fix the errors below',
            'validation_version': '2.0',
            'timestamp': timezone.now().isoformat()
        }
        
        # Cache the result if valid
        if result['valid']:
            ValidationCache.cache_result(cache_key, result, timeout=300)  # 5 minutes
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error in step 1 validation: {str(e)}")
        return Response({
            'valid': False,
            'errors': {'general': ['Validation error occurred. Please try again.']},
            'warnings': {},
            'field_scores': {},
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_step2_identity(request):
    """
    Validate step 2: Personal identity information
    - Validate name format and length
    - Check Ghana Card number format and uniqueness
    - Provide formatting suggestions
    """
    try:
        data = request.data
        errors = {}
        warnings = {}
        suggestions = {}
        
        # Validate first name
        first_name = data.get('first_name', '').strip()
        if not first_name:
            errors['first_name'] = 'First name is required'
        elif len(first_name) < 2:
            errors['first_name'] = 'First name must be at least 2 characters'
        elif len(first_name) > 50:
            errors['first_name'] = 'First name cannot exceed 50 characters'
        elif not re.match(r'^[a-zA-Z\s\'-]+$', first_name):
            errors['first_name'] = 'First name contains invalid characters'
        else:
            # Provide formatting suggestions
            if first_name != first_name.upper():
                suggestions['first_name'] = 'Consider using UPPERCASE as shown on your Ghana Card'
            if '.' in first_name:
                suggestions['first_name'] = 'Avoid abbreviations (use full name as on Ghana Card)'
        
        # Validate last name
        last_name = data.get('last_name', '').strip()
        if not last_name:
            errors['last_name'] = 'Last name is required'
        elif len(last_name) < 2:
            errors['last_name'] = 'Last name must be at least 2 characters'
        elif len(last_name) > 50:
            errors['last_name'] = 'Last name cannot exceed 50 characters'
        elif not re.match(r'^[a-zA-Z\s\'-]+$', last_name):
            errors['last_name'] = 'Last name contains invalid characters'
        else:
            # Provide formatting suggestions
            if last_name != last_name.upper():
                if 'first_name' not in suggestions:
                    suggestions['last_name'] = 'Consider using UPPERCASE as shown on your Ghana Card'
        
        # Validate Ghana Card number
        ghana_card_number = data.get('ghana_card_number', '').strip().upper()
        if not ghana_card_number:
            errors['ghana_card_number'] = 'Ghana Card number is required'
        else:
            # Check format
            if not re.match(r'^GHA-\d{9}-\d$', ghana_card_number):
                errors['ghana_card_number'] = 'Invalid Ghana Card format. Use: GHA-123456789-1'
            else:
                # Check uniqueness
                if User.objects.filter(ghana_card_number=ghana_card_number).exists():
                    errors['ghana_card_number'] = 'This Ghana Card number is already registered with another account'
        
        return Response({
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'suggestions': suggestions,
            'message': 'Identity information validated successfully' if len(errors) == 0 else 'Please fix the errors below'
        })
        
    except Exception as e:
        logger.error(f"Error in step 2 validation: {str(e)}")
        return Response({
            'valid': False,
            'errors': {'general': 'Validation error occurred. Please try again.'},
            'warnings': {},
            'suggestions': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@monitor_performance
@rate_limit(max_requests=20, window_seconds=60)  # Increased for development testing
def process_ghana_card_ocr(request):
    """
    Process Ghana Card images using AWS Textract service.
    Note: Function name kept for API compatibility, but now uses AWS Textract exclusively.
    """
    try:
        
        # Get uploaded files with comprehensive validation
        front_image = request.FILES.get('ghana_card_front_image')
        back_image = request.FILES.get('ghana_card_back_image')
        
        
        # Get form data for validation with safe access
        try:
            first_name = str(request.data.get('first_name', '')).strip()
            last_name = str(request.data.get('last_name', '')).strip()
            ghana_card_number = str(request.data.get('ghana_card_number', '')).strip().upper()
            
        except Exception as data_error:
            logger.error(f"Error accessing form data: {str(data_error)}")
            return Response({
                'success': False,
                'error': 'Invalid form data format',
                'results': None,
                'recommendations': ['Please ensure all form fields contain valid text']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate inputs
        if not front_image or not back_image:
            return Response({
                'success': False,
                'error': 'Both front and back images are required',
                'results': None,
                'recommendations': ['Please upload both sides of your Ghana Card']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not first_name or not last_name or not ghana_card_number:
            return Response({
                'success': False,
                'error': 'Personal information is required for verification',
                'results': None,
                'recommendations': ['Please provide your name and Ghana Card number']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Comprehensive file validation with enterprise-grade checks
        max_size = 10 * 1024 * 1024  # 10MB
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        
        for image, name in [(front_image, 'front'), (back_image, 'back')]:
            try:
                # Validate file existence and basic properties
                if not image or not hasattr(image, 'size'):
                    logger.error(f"Invalid {name} image object")
                    return Response({
                        'success': False,
                        'error': f'Invalid {name} image file',
                        'results': None,
                        'recommendations': ['Please upload a valid image file']
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                
                # Size validation
                if image.size > max_size:
                    logger.warning(f"{name.title()} image too large: {image.size} bytes")
                    return Response({
                        'success': False,
                        'error': f'Ghana Card {name} image is too large (max 10MB)',
                        'results': None,
                        'recommendations': ['Please compress your image or take a new photo']
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Content type validation
                content_type = getattr(image, 'content_type', '')
                if content_type not in allowed_types:
                    logger.warning(f"{name.title()} image invalid type: {content_type}")
                    return Response({
                        'success': False,
                        'error': f'Ghana Card {name} image format not supported: {content_type}',
                        'results': None,
                        'recommendations': ['Please upload JPEG, PNG, or WebP images']
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Binary data validation - check file headers
                try:
                    image.seek(0)
                    header_bytes = image.read(12)  # Read first 12 bytes for format detection
                    image.seek(0)
                    
                    # Validate file signatures
                    is_valid_format = (
                        header_bytes.startswith(b'\xff\xd8\xff') or  # JPEG
                        header_bytes.startswith(b'\x89PNG\r\n\x1a\n') or  # PNG
                        (header_bytes.startswith(b'RIFF') and b'WEBP' in header_bytes)  # WebP
                    )
                    
                    if not is_valid_format:
                        logger.warning(f"{name.title()} image has invalid file signature")
                        return Response({
                            'success': False,
                            'error': f'{name.title()} image appears to be corrupted or invalid format',
                            'results': None,
                            'recommendations': [
                                'Please ensure the image is a valid JPEG, PNG, or WebP file',
                                'Try taking a new photo if the image appears corrupted'
                            ]
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    
                except Exception as file_read_error:
                    logger.error(f"Error reading {name} image file: {str(file_read_error)}")
                    return Response({
                        'success': False,
                        'error': f'Cannot read {name} image file - file may be corrupted',
                        'results': None,
                        'recommendations': [
                            'Please try uploading the image again',
                            'Ensure the image file is not corrupted'
                        ]
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except Exception as validation_error:
                logger.error(f"Validation error for {name} image: {str(validation_error)}")
                return Response({
                    'success': False,
                    'error': f'Validation failed for {name} image: {str(validation_error)}',
                    'results': None,
                    'recommendations': ['Please try uploading a different image']
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate cache key for Textract results
        cache_data = f"{first_name}{last_name}{ghana_card_number}{front_image.size}{back_image.size}"
        cache_key = ValidationCache.get_cache_key('textract', cache_data)
        
        # Check if cache bypass is requested (for debugging)
        bypass_cache = request.data.get('bypass_cache', False) or request.GET.get('bypass_cache', False)
        
        if not bypass_cache:
            cached_result = ValidationCache.get_cached_result(cache_key)
            
            if cached_result:
                logger.info("[CACHE HIT] Textract result served from cache")
                # Add debug info about cache
                cached_result['from_cache'] = True
                return Response(cached_result)
        
        # Process using AWS Textract service with timeout protection
        try:
            from .ghana_card_textract_service import ghana_card_textract_service
            import concurrent.futures
            
            # Ensure image files are properly positioned
            if hasattr(front_image, 'seek'):
                front_image.seek(0)
            if hasattr(back_image, 'seek'):
                back_image.seek(0)
            
            # Use thread pool with strict timeout for AWS Textract processing
            def process_with_timeout():
                return ghana_card_textract_service.process_ghana_card_enterprise(
                    front_image,
                    back_image,
                    first_name,
                    last_name,
                    ghana_card_number
                )
            
            # Execute with 30-second timeout for AWS Textract
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(process_with_timeout)
                try:
                    result = future.result(timeout=30)  # AWS Textract may take longer than OCR
                except concurrent.futures.TimeoutError:
                    logger.warning("Ghana Card AWS Textract processing timed out after 30 seconds")
                    # Return a timeout result with bypass option
                    result = {
                        'success': False,
                        'verification_status': 'timeout',
                        'results': {
                            'extracted_name': None,
                            'extracted_number': None,
                            'name_verified': False,
                            'number_verified': False,
                            'message': 'AWS Textract processing timed out. You can proceed with manual verification or try again with clearer images.',
                            'bypass_available': True,  # Allow manual verification
                            'manual_verification_required': True
                        },
                        'processing_time_ms': 30000,
                        'recommendations': [
                            'Take new photos in bright, natural lighting',
                            'Ensure the Ghana Card text is clearly visible and not blurry',
                            'Hold the camera steady when taking photos',
                            'You may proceed with manual verification if Textract continues to fail'
                        ]
                    }
            
        except ImportError as import_error:
            logger.error(f"Import error: {str(import_error)}")
            result = {
                'success': False,
                'verification_status': 'error',
                'results': {
                    'extracted_name': None,
                    'extracted_number': None,
                    'name_verified': False,
                    'number_verified': False,
                    'confidence': 0,
                    'similarity_score': 0.0,
                    'message': 'AWS Textract service import failed',
                    'detailed_analysis': {
                        'name_components': [],
                        'card_number_segments': [],
                        'textract_quality_score': 0,
                        'image_quality_assessment': {
                            'front_image': {'clarity': 0, 'brightness': 0, 'contrast': 0},
                            'back_image': {'clarity': 0, 'brightness': 0, 'contrast': 0}
                        }
                    }
                },
                'errors': [f'Service import error: {str(import_error)}'],
                'processing_time_ms': 0,
                'recommendations': ['Please contact technical support']
            }
        except UnicodeDecodeError as e:
            logger.error(f"Unicode decode error in Ghana Card processing: {str(e)}")
            result = {
                'success': False,
                'verification_status': 'error',
                'results': {
                    'extracted_name': None,
                    'extracted_number': None,
                    'name_verified': False,
                    'number_verified': False,
                    'confidence': 0,
                    'similarity_score': 0.0,
                    'message': 'Image encoding error - please try with a different image format',
                    'detailed_analysis': {
                        'name_components': [],
                        'card_number_segments': [],
                        'textract_quality_score': 0,
                        'image_quality_assessment': {
                            'front_image': {'clarity': 0, 'brightness': 0, 'contrast': 0},
                            'back_image': {'clarity': 0, 'brightness': 0, 'contrast': 0}
                        }
                    }
                },
                'errors': ['Image encoding error'],
                'processing_time_ms': 0,
                'recommendations': [
                    'Please ensure images are in JPEG or PNG format',
                    'Try taking new photos with better lighting',
                    'Avoid screenshots or compressed images'
                ]
            }
        except Exception as e:
            logger.error(f"Unexpected error in Ghana Card processing: {str(e)}")
            result = {
                'success': False,
                'verification_status': 'error',
                'results': {
                    'extracted_name': None,
                    'extracted_number': None,
                    'name_verified': False,
                    'number_verified': False,
                    'confidence': 0,
                    'similarity_score': 0.0,
                    'message': 'Processing failed due to technical error',
                    'detailed_analysis': {
                        'name_components': [],
                        'card_number_segments': [],
                        'textract_quality_score': 0,
                        'image_quality_assessment': {
                            'front_image': {'clarity': 0, 'brightness': 0, 'contrast': 0},
                            'back_image': {'clarity': 0, 'brightness': 0, 'contrast': 0}
                        }
                    }
                },
                'errors': [f'Processing error: {str(e)}'],
                'processing_time_ms': 0,
                'recommendations': [
                    'Please try again with clear, well-lit images',
                    'Ensure images are not corrupted',
                    'Contact support if the issue persists'
                ]
            }
        
        # Add API-specific metadata and enhanced error information
        result.update({
            'client_timestamp': timezone.now().isoformat(),
            'textract_version': '1.0',
            'api_version': '2.0'
        })
        
        # Add enterprise-grade error categorization for frontend
        if not result.get('success', False):
            verification_status = result.get('verification_status', 'error')
            
            if verification_status == 'poor_quality':
                result['error_category'] = 'IMAGE_QUALITY'
                result['user_action_required'] = 'RETAKE_PHOTOS'
                result['priority'] = 'HIGH'
                result['can_retry'] = True
            elif verification_status == 'timeout':
                result['error_category'] = 'PROCESSING_TIMEOUT'
                result['user_action_required'] = 'RETRY_OR_MANUAL'
                result['priority'] = 'MEDIUM'
                result['can_retry'] = True
            else:
                result['error_category'] = 'PROCESSING_ERROR'
                result['user_action_required'] = 'CONTACT_SUPPORT'
                result['priority'] = 'LOW'
                result['can_retry'] = True
        
        # Cache successful results
        if result['success'] and result['verification_status'] in ['success', 'warning']:
            ValidationCache.cache_result(cache_key, result, timeout=1800)  # 30 minutes
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error in enterprise Ghana Card Textract processing: {str(e)}")
        return Response({
            'success': False,
            'error': 'AWS Textract processing failed due to technical error',
            'results': None,
            'recommendations': [
                'Please try again with clearer images',
                'Ensure good lighting and focus',
                'Contact support if the issue persists'
            ],
            'processing_time_ms': 0,
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_step4_security(request):
    """
    Validate step 4: Account security settings
    - Check password strength
    - Validate password confirmation
    - Return security recommendations
    """
    try:
        data = request.data
        errors = {}
        warnings = {}
        strength_score = 0
        
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validate password
        if not password:
            errors['password'] = 'Password is required'
        else:
            # Check password requirements
            requirements = {
                'length': len(password) >= 8,
                'uppercase': bool(re.search(r'[A-Z]', password)),
                'lowercase': bool(re.search(r'[a-z]', password)),
                'number': bool(re.search(r'\d', password)),
                'special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
            }
            
            # Calculate strength score
            strength_score = sum(requirements.values())
            
            # Check individual requirements
            if not requirements['length']:
                errors['password'] = 'Password must be at least 8 characters long'
            elif not requirements['uppercase']:
                errors['password'] = 'Password must contain at least one uppercase letter'
            elif not requirements['number']:
                errors['password'] = 'Password must contain at least one number'
            elif not requirements['special']:
                errors['password'] = 'Password must contain at least one special character'
            elif strength_score < 4:
                warnings['password'] = 'Password could be stronger. Consider adding more character types.'
        
        # Validate password confirmation
        if not confirm_password:
            errors['confirm_password'] = 'Please confirm your password'
        elif password and confirm_password and password != confirm_password:
            errors['confirm_password'] = 'Passwords do not match'
        
        # Determine password strength level
        strength_level = 'weak'
        if strength_score >= 5:
            strength_level = 'very_strong'
        elif strength_score >= 4:
            strength_level = 'strong'
        elif strength_score >= 3:
            strength_level = 'medium'
        elif strength_score >= 2:
            strength_level = 'fair'
        
        return Response({
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'password_strength': {
                'score': strength_score,
                'level': strength_level,
                'requirements': {
                    'length': len(password) >= 8 if password else False,
                    'uppercase': bool(re.search(r'[A-Z]', password)) if password else False,
                    'lowercase': bool(re.search(r'[a-z]', password)) if password else False,
                    'number': bool(re.search(r'\d', password)) if password else False,
                    'special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)) if password else False,
                }
            },
            'message': 'Security settings validated successfully' if len(errors) == 0 else 'Please fix the security issues'
        })
        
    except Exception as e:
        logger.error(f"Error in step 4 validation: {str(e)}")
        return Response({
            'valid': False,
            'errors': {'general': 'Validation error occurred. Please try again.'},
            'warnings': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@monitor_performance
@rate_limit(max_requests=5, window_seconds=60)
def send_verification_code(request):
    try:
        from .otp_service import otp_service, OTPType
        
        data = request.data
        verification_type = data.get('type')  # 'email' or 'phone'
        contact_info = data.get('contact_info', '').strip()
        
        # Validate input parameters
        if verification_type not in ['email', 'phone']:
            return Response({
                'success': False,
                'error': 'Invalid verification type. Must be "email" or "phone".',
                'code': 'INVALID_TYPE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not contact_info:
            return Response({
                'success': False,
                'error': f'{verification_type.title()} address is required.',
                'code': 'MISSING_CONTACT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to OTP type enum
        otp_type = OTPType.EMAIL if verification_type == 'email' else OTPType.PHONE
        
        # Prepare context for OTP delivery
        context = {
            'user_type': 'registration',
            'verification_step': 'account_creation',
            'request_ip': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')
        }
        
        # Send OTP using enterprise service
        result = asyncio.run(otp_service.send_otp(contact_info, otp_type, context))
        
        if result['success']:
            response_data = {
                'success': True,
                'message': result['message'],
                'otp_sent': True,
                'otp_id': result['otp_id'],
                'expires_in_seconds': result['expires_in_seconds'],
                'delivery_provider': result['delivery_info'].get('provider_used'),
                'delivery_time_ms': result['delivery_info'].get('delivery_time_ms'),
                'rate_limit_remaining': result.get('rate_limit_info', {}).get('remaining', 0)
            }
            
            # Include development OTP for testing
            if getattr(settings, 'DEBUG', False) and result.get('dev_otp'):
                response_data['dev_otp'] = result['dev_otp']
            
            return Response(response_data)
        else:
            # Handle rate limiting
            if result.get('rate_limit_info', {}).get('rate_limited'):
                return Response({
                    'success': False,
                    'error': result['message'],
                    'code': 'RATE_LIMITED',
                    'retry_after_seconds': result['rate_limit_info']['wait_time_seconds']
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Handle other errors
            return Response({
                'success': False,
                'error': result['message'],
                'code': 'DELIVERY_FAILED'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error in enterprise OTP sending: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Service temporarily unavailable. Please try again later.',
            'code': 'SERVICE_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@monitor_performance
@rate_limit(max_requests=10, window_seconds=60)
def verify_code(request):
    try:
        from .otp_service import otp_service, OTPType
        
        data = request.data
        verification_type = data.get('type')  # 'email' or 'phone'
        provided_code = data.get('code', '').strip()
        contact_info = data.get('contact_info', '').strip()
        otp_id = data.get('otp_id')
        
        # Validate input parameters
        if verification_type not in ['email', 'phone']:
            return Response({
                'success': False,
                'verified': False,
                'error': 'Invalid verification type. Must be "email" or "phone".',
                'code': 'INVALID_TYPE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not provided_code:
            return Response({
                'success': False,
                'verified': False,
                'error': 'Verification code is required.',
                'code': 'MISSING_CODE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not contact_info:
            return Response({
                'success': False,
                'verified': False,
                'error': 'Contact information is required.',
                'code': 'MISSING_CONTACT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to OTP type enum
        otp_type = OTPType.EMAIL if verification_type == 'email' else OTPType.PHONE
        
        # Verify OTP using enterprise service
        result = otp_service.verify_otp(contact_info, otp_type, provided_code, otp_id)
        
        if result['success'] and result['verified']:
            # Log successful verification
            logger.info(f"OTP verification successful for {verification_type}: {contact_info}")
            
            # Update user verification status
            try:
                from .models import User
                
                if verification_type == 'email':
                    # Find user by email and update email verification
                    user = User.objects.filter(email__iexact=contact_info).first()
                    if user and not user.email_verified:
                        user.verify_email()
                        logger.info(f"Email verified for {contact_info}. Fully verified: {user.is_verified}")
                    elif user and user.email_verified:
                        logger.info(f"User {contact_info} email was already verified")
                    else:
                        logger.warning(f"User not found for email verification: {contact_info}")
                        
                elif verification_type == 'phone':
                    # Find user by phone and update phone verification
                    user = User.objects.filter(phone_number=contact_info).first()
                    if user and not user.phone_verified:
                        user.verify_phone()
                        logger.info(f"Phone verified for {contact_info}. Fully verified: {user.is_verified}")
                    elif user and user.phone_verified:
                        logger.info(f"User {contact_info} phone was already verified")
                    else:
                        logger.warning(f"User not found for phone verification: {contact_info}")
                        
            except Exception as e:
                logger.error(f"Error updating user verification status: {str(e)}")
                # Don't fail the verification response due to this error
            
            return Response({
                'success': True,
                'verified': True,
                'message': result['message'],
                'verification_type': verification_type
            })
        else:
            # Log failed verification attempt
            logger.warning(f"OTP verification failed for {verification_type}: {contact_info} - {result['message']}")
            
            response_data = {
                'success': False,
                'verified': False,
                'error': result['message'],
                'attempts_left': result.get('attempts_left', 0)
            }
            
            # Add specific error codes
            if 'expired' in result['message'].lower():
                response_data['code'] = 'CODE_EXPIRED'
            elif 'incorrect' in result['message'].lower():
                response_data['code'] = 'INCORRECT_CODE'
            elif 'too many' in result['message'].lower():
                response_data['code'] = 'TOO_MANY_ATTEMPTS'
            else:
                response_data['code'] = 'VERIFICATION_FAILED'
            
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error in enterprise OTP verification: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'verified': False,
            'error': 'Verification service temporarily unavailable. Please try again later.',
            'code': 'SERVICE_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)