from rest_framework import serializers
from django.core.validators import validate_email
from decimal import Decimal, InvalidOperation
from datetime import datetime, date
from .models import (
    CreditApplication, 
    Applicant, 
    Address, 
    EmploymentInfo, 
    FinancialInfo, 
    BankAccount,
    Document,
    ApplicationNote
)
import uuid
import re

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        extra_kwargs = {
            'applicant': {'required': False}
        }
    
    def validate_postal_code(self, value):
        if value and not re.match(r'^[A-Za-z0-9\s-]{3,10}$', value):
            raise serializers.ValidationError("Invalid postal code format")
        return value
    
    def validate_country(self, value):
        if not value:
            return 'Ghana'  # Default country
        return value

class EmploymentInfoSerializer(serializers.ModelSerializer):
    duration_years = serializers.SerializerMethodField()
    
    class Meta:
        model = EmploymentInfo
        fields = '__all__'
        extra_kwargs = {
            'applicant': {'required': False},
            'monthly_income': {'required': False},
            'verification_documents': {'required': False}
        }
    
    def get_duration_years(self, obj):
        if obj.start_date:
            end = obj.end_date or date.today()
            return (end - obj.start_date).days / 365.25
        return 0
    
    def validate_monthly_income(self, value):
        try:
            if isinstance(value, str):
                income = Decimal(value)
            else:
                income = Decimal(str(value))
            if income < 0:
                raise serializers.ValidationError("Monthly income cannot be negative")
            return str(income)
        except (ValueError, InvalidOperation):
            raise serializers.ValidationError("Invalid income format")
    
    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        is_current = attrs.get('is_current', False)
        
        if start_date and start_date > date.today():
            raise serializers.ValidationError("Start date cannot be in the future")
        
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError("End date cannot be before start date")
        
        if is_current and end_date:
            raise serializers.ValidationError("Current employment cannot have an end date")
        
        return attrs

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'
        extra_kwargs = {
            'financial_info': {'required': False}
        }

class FinancialInfoSerializer(serializers.ModelSerializer):
    bank_accounts = BankAccountSerializer(many=True, required=False)
    net_worth = serializers.SerializerMethodField()  # Use SerializerMethodField for better control
    debt_to_income_ratio = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialInfo
        fields = '__all__'
        extra_kwargs = {
            'applicant': {'required': False},
            'bankruptcy_details': {'required': False}
        }
    
    def get_net_worth(self, obj):
        """
        Safe net worth calculation that handles string/decimal conversion
        """
        from decimal import Decimal, InvalidOperation
        
        try:
            assets = Decimal(str(obj.total_assets)) if obj.total_assets else Decimal('0')
            liabilities = Decimal(str(obj.total_liabilities)) if obj.total_liabilities else Decimal('0')
            return float(assets - liabilities)
        except (InvalidOperation, TypeError, ValueError):
            return 0.0
    
    def get_debt_to_income_ratio(self, obj):
        # This would need to be calculated based on employment info
        # For now, return a default or calculated value
        return None
    
    def validate_total_assets(self, value):
        try:
            if value is None or value == '':
                return '0.00'
            assets = Decimal(str(value))
            if assets < 0:
                raise serializers.ValidationError("Total assets cannot be negative")
            return str(assets)
        except (ValueError, InvalidOperation):
            raise serializers.ValidationError("Invalid assets format")
    
    def validate_total_liabilities(self, value):
        try:
            if value is None or value == '':
                return '0.00'
            liabilities = Decimal(str(value))
            if liabilities < 0:
                raise serializers.ValidationError("Total liabilities cannot be negative")
            return str(liabilities)
        except (ValueError, InvalidOperation):
            raise serializers.ValidationError("Invalid liabilities format")
    
    def validate_monthly_expenses(self, value):
        try:
            if value is None or value == '':
                return '0.00'
            expenses = Decimal(str(value))
            if expenses < 0:
                raise serializers.ValidationError("Monthly expenses cannot be negative")
            return str(expenses)
        except (ValueError, InvalidOperation):
            raise serializers.ValidationError("Invalid expenses format")

    def create(self, validated_data):
        bank_accounts_data = validated_data.pop('bank_accounts', [])
        financial_info = FinancialInfo.objects.create(**validated_data)
        
        for account_data in bank_accounts_data:
            BankAccount.objects.create(financial_info=financial_info, **account_data)
            
        return financial_info
    
    def update(self, instance, validated_data):
        bank_accounts_data = validated_data.pop('bank_accounts', [])
        
        # Update financial info
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle bank accounts update
        if bank_accounts_data:
            # Remove existing accounts and create new ones
            instance.bank_accounts.all().delete()
            for account_data in bank_accounts_data:
                BankAccount.objects.create(financial_info=instance, **account_data)
        
        return instance

class ApplicantSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, required=False)
    employment_history = EmploymentInfoSerializer(many=True, required=False)
    financial_info = FinancialInfoSerializer(required=False)
    full_name = serializers.ReadOnlyField()
    age = serializers.SerializerMethodField()
    
    # Frontend compatibility fields (allow both formats)
    firstName = serializers.CharField(write_only=True, required=False)
    lastName = serializers.CharField(write_only=True, required=False)
    otherNames = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False)
    dob = serializers.CharField(write_only=True, required=False)
    nationalIDNumber = serializers.CharField(write_only=True, required=False)
    ssnitNumber = serializers.CharField(write_only=True, required=False)
    jobTitle = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Applicant
        fields = '__all__'
        extra_kwargs = {
            'application': {'required': False},
            'middle_name': {'required': False},
            'tax_id': {'required': False},
            'alternate_phone': {'required': False}
        }
    
    def get_age(self, obj):
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    
    def validate_email(self, value):
        # Allow draft emails to bypass validation
        if value and not value == 'draft@example.com':
            validate_email(value)
        return value
    
    def validate_national_id(self, value):
        # Ghana National ID validation - allow draft format
        if value and not value.startswith('DRAFT-'):
            if not re.match(r'^GHA-\d{9}-\d{1}$', value):
                # Allow flexible format for now, but could be stricter
                if not re.match(r'^[A-Z0-9-]{10,20}$', value):
                    raise serializers.ValidationError("Invalid National ID format")
        return value
    
    def validate_phone_number(self, value):
        # Ghana phone number validation - allow draft format
        if value and not value.startswith('+233200000000'):
            if not re.match(r'^(\+233|0)[2-9]\d{8}$', value):
                raise serializers.ValidationError("Invalid Ghana phone number format")
        return value
    
    def validate_gender(self, value):
        # Handle frontend gender values
        gender_map = {
            'male': 'M',
            'female': 'F', 
            'other': 'O',
            'prefer_not_to_say': 'P',
            'M': 'M',
            'F': 'F',
            'O': 'O',
            'P': 'P'
        }
        # Direct backend values should pass through
        if value in ['M', 'F', 'O', 'P']:
            return value
        mapped_value = gender_map.get(value.lower() if isinstance(value, str) else value)
        if not mapped_value:
            raise serializers.ValidationError("Invalid gender value")
        return mapped_value
    
    def validate_marital_status(self, value):
        # Handle frontend marital status values
        status_map = {
            'single': 'S',
            'married': 'M',
            'divorced': 'D',
            'widowed': 'W',
            'S': 'S',
            'M': 'M',
            'D': 'D',
            'W': 'W'
        }
        # Direct backend values should pass through
        if value in ['S', 'M', 'D', 'W']:
            return value
        mapped_value = status_map.get(value.lower() if isinstance(value, str) else value)
        if not mapped_value:
            raise serializers.ValidationError("Invalid marital status value")
        return mapped_value
    
    def validate_date_of_birth(self, value):
        if isinstance(value, str):
            try:
                dob = datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Invalid date format. Use YYYY-MM-DD")
        else:
            dob = value
        
        # Check age constraints
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        
        if age < 18:
            raise serializers.ValidationError("Applicant must be at least 18 years old")
        if age > 100:
            raise serializers.ValidationError("Invalid date of birth")
        
        return dob
    
    def to_internal_value(self, data):
        # Handle frontend field mapping
        if 'firstName' in data:
            data['first_name'] = data.pop('firstName')
        if 'lastName' in data:
            data['last_name'] = data.pop('lastName')
        if 'otherNames' in data:
            data['middle_name'] = data.pop('otherNames')
        if 'phone' in data:
            data['phone_number'] = data.pop('phone')
        if 'dob' in data:
            data['date_of_birth'] = data.pop('dob')
        if 'nationalIDNumber' in data:
            data['national_id'] = data.pop('nationalIDNumber')
        if 'ssnitNumber' in data:
            data['tax_id'] = data.pop('ssnitNumber')
        if 'jobTitle' in data:
            # Store jobTitle for employment history creation
            data['_job_title'] = data.pop('jobTitle')
        
        return super().to_internal_value(data)

    def create(self, validated_data):
        addresses_data = validated_data.pop('addresses', [])
        employment_data = validated_data.pop('employment_history', [])
        financial_data = validated_data.pop('financial_info', None)
        
        applicant = Applicant.objects.create(**validated_data)
        
        # Create addresses
        for address_data in addresses_data:
            Address.objects.create(applicant=applicant, **address_data)
            
        # Create employment history
        for emp_data in employment_data:
            EmploymentInfo.objects.create(applicant=applicant, **emp_data)
            
        # Create financial information
        if financial_data:
            bank_accounts_data = financial_data.pop('bank_accounts', [])
            financial_info = FinancialInfo.objects.create(applicant=applicant, **financial_data)
            
            for account_data in bank_accounts_data:
                BankAccount.objects.create(financial_info=financial_info, **account_data)
                
        return applicant
    
    def update(self, instance, validated_data):
        addresses_data = validated_data.pop('addresses', [])
        employment_data = validated_data.pop('employment_history', [])
        financial_data = validated_data.pop('financial_info', None)
        
        # Update basic applicant fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update addresses
        if addresses_data:
            instance.addresses.all().delete()
            for address_data in addresses_data:
                Address.objects.create(applicant=instance, **address_data)
        
        # Update employment history
        if employment_data:
            instance.employment_history.all().delete()
            for emp_data in employment_data:
                EmploymentInfo.objects.create(applicant=instance, **emp_data)
        
        # Update financial info
        if financial_data:
            bank_accounts_data = financial_data.pop('bank_accounts', [])
            financial_info, created = FinancialInfo.objects.get_or_create(
                applicant=instance,
                defaults=financial_data
            )
            if not created:
                for attr, value in financial_data.items():
                    setattr(financial_info, attr, value)
                financial_info.save()
            
            # Update bank accounts
            financial_info.bank_accounts.all().delete()
            for account_data in bank_accounts_data:
                BankAccount.objects.create(financial_info=financial_info, **account_data)
        
        return instance

class DocumentSerializer(serializers.ModelSerializer):
    file_size = serializers.SerializerMethodField()
    file_extension = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = '__all__'
        extra_kwargs = {
            'application': {'required': False},
            'verified': {'read_only': True},
            'verification_notes': {'read_only': True}
        }
    
    def get_file_size(self, obj):
        if obj.file:
            return obj.file.size
        return 0
    
    def get_file_extension(self, obj):
        if obj.file:
            import os
            return os.path.splitext(obj.file.name)[1].lower()
        return ''
    
    def validate_file(self, value):
        # File size validation (10MB max)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        
        # File type validation
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
        import os
        file_extension = os.path.splitext(value.name)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise serializers.ValidationError(f"File type {file_extension} is not allowed")
        
        # Security check for file content
        if file_extension in ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js']:
            raise serializers.ValidationError("Executable files are not allowed")
        
        return value
    
    def validate(self, attrs):
        document_type = attrs.get('document_type')
        file = attrs.get('file')
        
        if file and document_type:
            import os
            file_extension = os.path.splitext(file.name)[1].lower()
            
            # Document type specific validations
            if document_type == 'ID':
                if file_extension not in ['.pdf', '.jpg', '.jpeg', '.png']:
                    raise serializers.ValidationError("ID documents must be PDF or image files")
            elif document_type in ['PROOF_OF_INCOME', 'TAX_RETURN']:
                if file_extension not in ['.pdf', '.doc', '.docx']:
                    raise serializers.ValidationError("Income documents should be PDF or Word documents")
            elif document_type == 'BANK_STATEMENT':
                if file_extension not in ['.pdf', '.xls', '.xlsx', '.csv']:
                    raise serializers.ValidationError("Bank statements should be PDF or spreadsheet files")
        
        return attrs

class ApplicationNoteSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)
    
    class Meta:
        model = ApplicationNote
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

class CreditApplicationSerializer(serializers.ModelSerializer):
    applicant_info = ApplicantSerializer(required=False)
    documents = DocumentSerializer(many=True, read_only=True)  
    additional_notes = ApplicationNoteSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # INDUSTRY STANDARD FIX: Override applicant field to prevent validation
    applicant = serializers.HiddenField(default=None)
    
    # Computed fields
    completion_percentage = serializers.SerializerMethodField()
    days_since_submission = serializers.SerializerMethodField()
    risk_level = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditApplication
        fields = '__all__'
        read_only_fields = ['reference_number', 'submission_date', 'assigned_analyst']
        extra_kwargs = {
            'applicant': {'required': False, 'allow_null': True, 'write_only': True}
        }
    
    def get_completion_percentage(self, obj):
        total_fields = 4  # Basic sections: personal, employment, financial, documents
        completed = 0
        
        if hasattr(obj, 'applicant_info') and obj.applicant_info:
            completed += 1
            if obj.applicant_info.employment_history.exists():
                completed += 1
            if hasattr(obj.applicant_info, 'financial_info') and obj.applicant_info.financial_info:
                completed += 1
        
        if obj.documents.exists():
            completed += 1
            
        return int((completed / total_fields) * 100)
    
    def get_days_since_submission(self, obj):
        if obj.submission_date:
            from django.utils import timezone
            return (timezone.now().date() - obj.submission_date.date()).days
        return None
    
    def get_risk_level(self, obj):
        # This would integrate with risk assessment
        if hasattr(obj, 'risk_assessment') and obj.risk_assessment:
            return obj.risk_assessment.risk_rating
        return None
    
    def to_internal_value(self, data):
        """
        INDUSTRY STANDARD FIX: Comprehensive data transformation and validation override
        """
        if isinstance(data, dict):
            data = data.copy()  # Don't modify original
            
            # DEFENSIVE LAYER 1: Remove any applicant data that might cause validation errors
            data.pop('applicant', None)
            
            # DEFENSIVE LAYER 2: Ensure applicant field is set to None for HiddenField
            data['applicant'] = None
            
            # Handle nested applicant_info frontend field mapping
            if 'applicant_info' in data and isinstance(data['applicant_info'], dict):
                applicant_data = data['applicant_info'].copy()
                
                # Transform frontend fields to backend fields
                field_mapping = {
                    'firstName': 'first_name',
                    'lastName': 'last_name', 
                    'otherNames': 'middle_name',
                    'phone': 'phone_number',
                    'dob': 'date_of_birth',
                    'nationalIDNumber': 'national_id',
                    'ssnitNumber': 'tax_id',
                    'jobTitle': '_job_title'  # Handle jobTitle for employment
                }
                
                for frontend_field, backend_field in field_mapping.items():
                    if frontend_field in applicant_data:
                        applicant_data[backend_field] = applicant_data.pop(frontend_field)
                
                # Transform frontend gender values to backend values
                if 'gender' in applicant_data:
                    gender_map = {
                        'male': 'M', 'female': 'F', 'other': 'O', 'prefer_not_to_say': 'P'
                    }
                    if applicant_data['gender'] in gender_map:
                        applicant_data['gender'] = gender_map[applicant_data['gender']]
                
                # Transform frontend marital status values to backend values  
                if 'maritalStatus' in applicant_data:
                    status_map = {
                        'single': 'S', 'married': 'M', 'divorced': 'D', 'widowed': 'W'
                    }
                    if applicant_data['maritalStatus'] in status_map:
                        applicant_data['marital_status'] = status_map[applicant_data['maritalStatus']]
                    del applicant_data['maritalStatus']
                
                # Ensure financial data has proper defaults
                if 'financial_info' in applicant_data:
                    financial_data = applicant_data['financial_info']
                    # Set defaults for financial fields to prevent string math errors
                    financial_data.setdefault('total_assets', '0.00')
                    financial_data.setdefault('total_liabilities', '0.00')
                    financial_data.setdefault('monthly_expenses', '0.00')
                
                data['applicant_info'] = applicant_data
            
            # Handle direct ML model fields mapping from frontend form
            ml_field_mapping = {
                'annualIncome': 'annual_income',
                'loanAmount': 'loan_amount', 
                'interestRate': 'interest_rate',
                'dti': 'debt_to_income_ratio',
                'creditHistoryLength': 'credit_history_length',
                'revolvingUtilization': 'revolving_utilization',
                'maxBankcardBalance': 'max_bankcard_balance',
                'delinquencies2yr': 'delinquencies_2yr',
                'totalAccounts': 'total_accounts',
                'inquiries6mo': 'inquiries_6mo', 
                'revolvingAccounts12mo': 'revolving_accounts_12mo',
                'employmentLength': 'employment_length',
                'publicRecords': 'public_records',
                'openAccounts': 'open_accounts',
                'homeOwnership': 'home_ownership',
                'collections12mo': 'collections_12mo',
                'jobTitle': 'job_title'  # Ghana employment analysis field
            }
            
            for frontend_field, backend_field in ml_field_mapping.items():
                if frontend_field in data:
                    data[backend_field] = data.pop(frontend_field)
        
        return super().to_internal_value(data)
    
    def validate(self, attrs):
        """
        INDUSTRY STANDARD FIX: Final validation layer with applicant field safety
        """
        # DEFENSIVE LAYER 3: Ultimate safety - remove applicant from validated data
        attrs.pop('applicant', None)
        
        # Ensure logical status transitions
        if self.instance:
            current_status = self.instance.status
            new_status = attrs.get('status', current_status)
            
            invalid_transitions = {
                'SUBMITTED': ['DRAFT'],
                'UNDER_REVIEW': ['DRAFT'],
                'APPROVED': ['DRAFT', 'SUBMITTED'],
                'REJECTED': ['DRAFT', 'SUBMITTED']
            }
            
            if current_status in invalid_transitions:
                if new_status in invalid_transitions[current_status]:
                    raise serializers.ValidationError(
                        f"Cannot change status from {current_status} to {new_status}"
                    )
        
        return attrs
        
    def create(self, validated_data):
        """
        INDUSTRY STANDARD FIX: Robust create method with comprehensive safety layers
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # DEFENSIVE LAYER 4: Final cleanup of applicant field
        applicant_data = validated_data.pop('applicant_info', None)
        validated_data.pop('applicant', None)  # Remove any lingering applicant field
        
        logger.info(f"Create method - applicant_data: {applicant_data}")
        logger.info(f"Create method - validated_data: {validated_data}")
        
        # Get authenticated user from request context
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required")
        
        if not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated")
        
        # DEFENSIVE LAYER 5: Explicitly set applicant to authenticated user
        # This bypasses any field validation issues
        try:
            application = CreditApplication.objects.create(
                applicant=request.user, 
                **validated_data
            )
            logger.info(f"Application created successfully: {application.id}")
        except Exception as e:
            logger.error(f"Failed to create application: {str(e)}")
            raise serializers.ValidationError(f"Failed to create application: {str(e)}")
        
        if applicant_data:
            # Ensure financial info has proper defaults before validation
            if 'financial_info' in applicant_data:
                financial_data = applicant_data['financial_info']
                financial_data.setdefault('total_assets', '0.00')
                financial_data.setdefault('total_liabilities', '0.00')
                financial_data.setdefault('monthly_expenses', '0.00')
                financial_data.setdefault('has_bankruptcy', False)
            
            logger.info(f"About to validate applicant data: {applicant_data}")
            applicant_serializer = ApplicantSerializer(data=applicant_data)
            if applicant_serializer.is_valid():
                try:
                    applicant_serializer.save(application=application)
                    logger.info("Applicant info saved successfully")
                except Exception as e:
                    # If saving fails, delete the application and raise error
                    logger.error(f"Failed to save applicant info: {str(e)}")
                    application.delete()
                    raise serializers.ValidationError(f"Failed to save applicant info: {str(e)}")
            else:
                # If applicant data is invalid, delete the application and raise error
                logger.error(f"Applicant validation failed: {applicant_serializer.errors}")
                application.delete()
                raise serializers.ValidationError({
                    'applicant_info': applicant_serializer.errors
                })
        
        # JOB TITLE FIX: Ensure job_title from Financial step gets to CreditApplication.job_title
        # Try multiple strategies to get the job title
        if not application.job_title:
            logger.debug(f"Attempting to fix missing job title for application {application.id}")
            
            # Strategy 1: From nested applicant_info
            if hasattr(application, 'applicant_info'):
                try:
                    applicant = application.applicant_info
                    employment = applicant.employment_history.first()
                    if employment and employment.job_title:
                        application.job_title = employment.job_title
                        application.save()
                        logger.info(f"Auto-fixed job title from applicant_info: '{employment.job_title}'")
                except Exception as e:
                    logger.debug(f"Could not get job title from applicant_info: {str(e)}")
            
            # Strategy 2: Direct database query
            if not application.job_title:
                try:
                    from .models import Applicant, EmploymentInfo
                    applicant = Applicant.objects.filter(application=application).first()
                    if applicant:
                        employment = EmploymentInfo.objects.filter(applicant=applicant).first()
                        if employment and employment.job_title:
                            application.job_title = employment.job_title
                            application.save()
                            logger.info(f"Auto-fixed job title from direct query: '{employment.job_title}'")
                except Exception as e:
                    logger.debug(f"Could not get job title from direct query: {str(e)}")
            
            if not application.job_title:
                logger.warning(f"Could not determine job title for application {application.id} - will use 'Other' in ML model")
                
        return application
    
    def update(self, instance, validated_data):
        applicant_data = validated_data.pop('applicant_info', None)
        
        # Update application fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update applicant info if provided
        if applicant_data:
            if hasattr(instance, 'applicant_info') and instance.applicant_info:
                applicant_serializer = ApplicantSerializer(
                    instance.applicant_info, 
                    data=applicant_data, 
                    partial=True
                )
                if applicant_serializer.is_valid():
                    applicant_serializer.save()
                else:
                    raise serializers.ValidationError({
                        'applicant_info': applicant_serializer.errors
                    })
            else:
                applicant_serializer = ApplicantSerializer(data=applicant_data)
                if applicant_serializer.is_valid():
                    applicant_serializer.save(application=instance)
                else:
                    raise serializers.ValidationError({
                        'applicant_info': applicant_serializer.errors
                    })
        
        return instance

class ApplicationSubmitSerializer(serializers.Serializer):
    confirm = serializers.BooleanField(required=True, write_only=True)
    
    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm submission")
        return value