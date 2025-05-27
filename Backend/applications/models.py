from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User
import uuid
from datetime import timezone

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
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
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
    
    class Meta:
        ordering = ['-submission_date']
        permissions = [
            ('can_assign_analyst', 'Can assign applications to analysts'),
            ('can_change_status', 'Can change application status'),
        ]
    
    def save(self, *args, **kwargs):
        if not self.reference_number and self.status == 'SUBMITTED':
            self.reference_number = self._generate_reference_number()
        super().save(*args, **kwargs)
    
    def _generate_reference_number(self):
        # Generate a unique reference number like RG-2023-0001
        from django.db.models import Max
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
    job_title = models.CharField(max_length=100)
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
        return self.total_assets - self.total_liabilities
    
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
        ('OTHER', 'Other'),
    )
    
    application = models.ForeignKey(CreditApplication, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
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