from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()

class Report(models.Model):
    """
    Main report model for storing generated reports
    """
    REPORT_TYPES = (
        ('RISK_SUMMARY', 'Risk Assessment Summary'),
        ('APPLICATION_ANALYTICS', 'Application Analytics'),
        ('PERFORMANCE_METRICS', 'Performance Metrics'),
        ('COMPLIANCE_AUDIT', 'Compliance Audit Report'),
        ('FINANCIAL_OVERVIEW', 'Financial Overview'),
        ('MONTHLY_SUMMARY', 'Monthly Summary'),
        ('QUARTERLY_REPORT', 'Quarterly Report'),
        ('CUSTOM', 'Custom Report'),
    )
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('GENERATING', 'Generating'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('EXPIRED', 'Expired'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # User and permissions
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reports')
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_reports')
    
    # Date filters
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    
    # Report configuration
    filters = models.JSONField(default=dict, help_text="Report filters and parameters")
    config = models.JSONField(default=dict, help_text="Report configuration settings")
    
    # Report data and files
    data = models.JSONField(default=dict, help_text="Generated report data")
    file_path = models.CharField(max_length=500, blank=True, help_text="Path to generated file")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    views_count = models.PositiveIntegerField(default=0)
    downloads_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'status']),
            models.Index(fields=['created_by', 'created_at']),
            models.Index(fields=['date_from', 'date_to']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_report_type_display()})"


class ReportTemplate(models.Model):
    """
    Reusable report templates
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=Report.REPORT_TYPES)
    
    # Template configuration
    template_config = models.JSONField(default=dict)
    default_filters = models.JSONField(default=dict)
    
    # Access control
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_templates')
    is_public = models.BooleanField(default=False)
    allowed_roles = models.JSONField(default=list, help_text="List of roles that can use this template")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ReportSchedule(models.Model):
    """
    Scheduled report generation
    """
    FREQUENCY_CHOICES = (
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'), 
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    )
    
    name = models.CharField(max_length=255)
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    
    # Schedule configuration
    is_active = models.BooleanField(default=True)
    next_run = models.DateTimeField()
    last_run = models.DateTimeField(null=True, blank=True)
    
    # Recipients
    recipients = models.ManyToManyField(User, related_name='scheduled_reports')
    email_recipients = models.JSONField(default=list, help_text="Additional email addresses")
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['next_run']
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"


class ReportAccess(models.Model):
    """
    Track report access and analytics
    """
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_accesses')
    
    ACTION_CHOICES = (
        ('VIEW', 'Viewed'),
        ('DOWNLOAD', 'Downloaded'),
        ('SHARE', 'Shared'),
        ('EXPORT', 'Exported'),
    )
    
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Export details
    export_format = models.CharField(max_length=20, blank=True)
    export_size = models.PositiveIntegerField(null=True, blank=True, help_text="File size in bytes")
    
    accessed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['report', 'action']),
            models.Index(fields=['user', 'accessed_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} {self.get_action_display().lower()} {self.report.title}"


class ReportKPI(models.Model):
    """
    Key Performance Indicators for reports
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # KPI configuration
    metric_type = models.CharField(max_length=50, choices=[
        ('COUNT', 'Count'),
        ('PERCENTAGE', 'Percentage'),
        ('AVERAGE', 'Average'),
        ('SUM', 'Sum'),
        ('RATIO', 'Ratio'),
        ('TREND', 'Trend'),
    ])
    
    # Data source configuration
    data_source = models.CharField(max_length=100)
    calculation_method = models.TextField(help_text="SQL or calculation method")
    
    # Display configuration
    display_format = models.CharField(max_length=50, default='number')
    color_scheme = models.JSONField(default=dict)
    chart_type = models.CharField(max_length=50, blank=True)
    
    # Access control
    required_permissions = models.JSONField(default=list)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Report KPI"
        verbose_name_plural = "Report KPIs"
    
    def __str__(self):
        return self.name


class ReportComment(models.Model):
    """
    Comments and notes on reports
    """
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    comment = models.TextField()
    is_internal = models.BooleanField(default=False, help_text="Internal comment not visible to clients")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comment by {self.user.get_full_name()} on {self.report.title}"