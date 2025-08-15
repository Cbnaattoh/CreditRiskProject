from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User
import uuid
from django.utils import timezone

class ApplicationManager(models.Manager):
    """Custom manager to handle soft delete filtering"""
    
    def get_queryset(self):
        """Return only non-deleted applications by default"""
        return super().get_queryset().filter(is_deleted=False)
    
    def with_deleted(self):
        """Return all applications including soft-deleted ones"""
        return super().get_queryset()
    
    def deleted_only(self):
        """Return only soft-deleted applications"""
        return super().get_queryset().filter(is_deleted=True)

class CreditApplication(models.Model):
    APPLICATION_STATUS = (
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('NEEDS_INFO', 'Needs More Information'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_number = models.CharField(max_length=20, unique=True, editable=False)
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications', null=True, blank=True)
    status = models.CharField(max_length=15, choices=APPLICATION_STATUS, default='DRAFT')
    submission_date = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    assigned_analyst = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_applications',
        limit_choices_to={'user_type': 'ANALYST'}
    )
    is_priority = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    # Loan Application Fields
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    credit_history_length = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    revolving_utilization = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_bankcard_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    delinquencies_2yr = models.IntegerField(null=True, blank=True)
    total_accounts = models.IntegerField(null=True, blank=True)
    inquiries_6mo = models.IntegerField(null=True, blank=True)
    revolving_accounts_12mo = models.IntegerField(null=True, blank=True)
    employment_length = models.CharField(max_length=50, blank=True)
    public_records = models.IntegerField(null=True, blank=True)
    open_accounts = models.IntegerField(null=True, blank=True)
    home_ownership = models.CharField(max_length=20, blank=True)
    collections_12mo = models.IntegerField(null=True, blank=True)
    annual_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    debt_to_income_ratio = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Ghana-specific ML model fields
    job_title = models.CharField(max_length=100, blank=True, help_text="Job title for Ghana employment analysis (emp_title field)")
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='deleted_applications'
    )
    
    # Custom manager
    objects = ApplicationManager()
    
    class Meta:
        ordering = ['-submission_date']
        permissions = [
            ('can_assign_analyst', 'Can assign applications to analysts'),
            ('can_change_status', 'Can change application status'),
        ]
    
    def save(self, *args, **kwargs):
        if not self.reference_number and self.status == 'SUBMITTED':
            self.reference_number = self._generate_reference_number()
        if self.status == 'SUBMITTED' and not self.submission_date:
            self.submission_date = timezone.now()
        super().save(*args, **kwargs)
    
    @classmethod
    def create_for_user(cls, user, **kwargs):
        """
        INDUSTRY STANDARD: Safe creation method that ensures applicant is always set
        """
        kwargs['applicant'] = user
        return cls.objects.create(**kwargs)
    
    def _generate_reference_number(self):
        # Generate a unique reference number like RG-2023-0001
        from django.db.models import Max
        from django.utils import timezone
        year = str(timezone.now().year)
        max_id = CreditApplication.objects.filter(
            reference_number__startswith=f'RG-{year}-'
        ).aggregate(Max('reference_number'))['reference_number__max']
        
        if max_id:
            last_num = int(max_id.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
            
        return f"RG-{year}-{new_num:04d}"
    
    def soft_delete(self, user=None):
        """Soft delete the application"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save()
    
    def restore(self):
        """Restore a soft deleted application"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save()
    
    def __str__(self):
        return f"Application {self.reference_number} - {self.get_status_display()}"

class Applicant(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('P', 'Prefer not to say'),
    )
    
    MARITAL_STATUS_CHOICES = (
        ('S', 'Single'),
        ('M', 'Married'),
        ('D', 'Divorced'),
        ('W', 'Widowed'),
    )
    
    application = models.OneToOneField(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='applicant_info'
    )
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    marital_status = models.CharField(max_length=1, choices=MARITAL_STATUS_CHOICES)
    national_id = models.CharField(max_length=50)
    tax_id = models.CharField(max_length=50, blank=True)
    phone_number = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField()
    
    def full_name(self):
        return f"{self.first_name} {self.middle_name} {self.last_name}".strip()
    
    def __str__(self):
        return self.full_name()

class Address(models.Model):
    ADDRESS_TYPES = (
        ('HOME', 'Home Address'),
        ('WORK', 'Work Address'),
        ('OTHER', 'Other Address'),
    )
    
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=5, choices=ADDRESS_TYPES)
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = "Addresses"
    
    def __str__(self):
        return f"{self.get_address_type_display()} - {self.street_address}, {self.city}"

class EmploymentInfo(models.Model):
    EMPLOYMENT_TYPES = (
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('SELF_EMPLOYED', 'Self-employed'),
        ('UNEMPLOYED', 'Unemployed'),
        ('RETIRED', 'Retired'),
    )
    
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='employment_history')
    employer_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100, help_text="Job title for employment record")
    employment_type = models.CharField(max_length=15, choices=EMPLOYMENT_TYPES)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    income_verified = models.BooleanField(default=False)
    verification_documents = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Employment Information"
    
    def __str__(self):
        return f"{self.employer_name} - {self.job_title}"

class FinancialInfo(models.Model):
    applicant = models.OneToOneField(Applicant, on_delete=models.CASCADE, related_name='financial_info')
    total_assets = models.DecimalField(max_digits=15, decimal_places=2)
    total_liabilities = models.DecimalField(max_digits=15, decimal_places=2)
    monthly_expenses = models.DecimalField(max_digits=12, decimal_places=2)
    has_bankruptcy = models.BooleanField(default=False)
    bankruptcy_details = models.TextField(blank=True)
    credit_score = models.IntegerField(null=True, blank=True)
    credit_score_last_updated = models.DateField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "Financial Information"
    
    @property
    def net_worth(self):
        """
        Calculate net worth with proper decimal handling
        """
        from decimal import Decimal, InvalidOperation
        
        try:
            assets = Decimal(str(self.total_assets)) if self.total_assets else Decimal('0')
            liabilities = Decimal(str(self.total_liabilities)) if self.total_liabilities else Decimal('0')
            return assets - liabilities
        except (InvalidOperation, TypeError, ValueError):
            return Decimal('0')
    
    def __str__(self):
        return f"Financial Info - {self.applicant.full_name()}"

class BankAccount(models.Model):
    ACCOUNT_TYPES = (
        ('CHECKING', 'Checking Account'),
        ('SAVINGS', 'Savings Account'),
        ('INVESTMENT', 'Investment Account'),
        ('OTHER', 'Other'),
    )
    
    financial_info = models.ForeignKey(FinancialInfo, on_delete=models.CASCADE, related_name='bank_accounts')
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)  # Encrypted in practice
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    is_primary = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.bank_name} - {self.get_account_type_display()}"

class Document(models.Model):
    DOCUMENT_TYPES = (
        ('ID', 'Identification'),
        ('PROOF_OF_INCOME', 'Proof of Income'),
        ('TAX_RETURN', 'Tax Return'),
        ('BANK_STATEMENT', 'Bank Statement'),
        ('CREDIT_REPORT', 'Credit Report'),
        ('PROPERTY_DEED', 'Property Deed'),
        ('BUSINESS_REGISTRATION', 'Business Registration'),
        ('INSURANCE_DOCUMENT', 'Insurance Document'),
        ('OTHER', 'Other'),
    )
    
    application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=25, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='application_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.application.reference_number}"

class ApplicationNote(models.Model):
    application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='additional_notes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_internal = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Note by {self.author.email} on {self.created_at}"

class MLCreditAssessment(models.Model):
    """
    Store ML model predictions alongside applications
    Integrates with Ghana employment analysis
    """
    application = models.OneToOneField(
        CreditApplication,
        on_delete=models.CASCADE,
        related_name='ml_assessment'
    )
    
    # ML Prediction Results
    credit_score = models.IntegerField(help_text="Predicted credit score (300-850)")
    category = models.CharField(max_length=20, help_text="Poor, Fair, Good, Very Good, Exceptional")
    risk_level = models.CharField(max_length=20, help_text="Very High Risk, High Risk, Medium Risk, Low Risk")
    confidence = models.FloatField(help_text="Prediction confidence percentage")
    
    # Ghana Employment Analysis
    ghana_job_category = models.CharField(max_length=50, null=True, blank=True, help_text="Categorized job type")
    ghana_employment_score = models.FloatField(null=True, blank=True, help_text="Employment stability score")
    ghana_job_stability_score = models.IntegerField(null=True, blank=True, help_text="Job stability score (20-85/100)")
    
    # Model Metadata
    model_version = models.CharField(max_length=20, default='2.0.0')
    prediction_timestamp = models.DateTimeField(auto_now_add=True)
    model_accuracy = models.FloatField(default=98.4, help_text="Model R² accuracy")
    
    # Confidence Factors (JSON field for detailed breakdown)
    confidence_factors = models.JSONField(null=True, blank=True, help_text="Detailed confidence analysis")
    
    # Processing metadata
    processing_time_ms = models.IntegerField(null=True, blank=True, help_text="Prediction processing time in milliseconds")
    features_used = models.JSONField(null=True, blank=True, help_text="Features used for prediction")
    
    # Processing status and error tracking
    processing_status = models.CharField(max_length=20, default='COMPLETED', choices=[
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('RETRYING', 'Retrying')
    ], help_text="Current processing status")
    processing_error = models.TextField(null=True, blank=True, help_text="Error message if processing failed")
    retry_count = models.IntegerField(default=0, help_text="Number of processing retries")
    last_updated = models.DateTimeField(auto_now=True, help_text="Last time this assessment was updated")
    
    class Meta:
        db_table = 'ml_credit_assessments'
        verbose_name = 'ML Credit Assessment'
        verbose_name_plural = 'ML Credit Assessments'
        ordering = ['-prediction_timestamp']
    
    def __str__(self):
        return f"ML Assessment for {self.application.reference_number} - Score: {self.credit_score}"
    
    @property
    def risk_color(self):
        """Return color code for risk level display"""
        colors = {
            'Low Risk': 'green',
            'Medium Risk': 'yellow', 
            'High Risk': 'orange',
            'Very High Risk': 'red'
        }
        return colors.get(self.risk_level, 'gray')