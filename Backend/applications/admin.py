from django.contrib import admin
from .models import CreditApplication, Applicant, Document, MLCreditAssessment
from risk.models import RiskAssessment, Decision

class ApplicantInline(admin.StackedInline):
    model = Applicant
    extra = 0

class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0

class RiskAssessmentInline(admin.StackedInline):
    model = RiskAssessment
    extra = 0
    readonly_fields = ['risk_score', 'probability_of_default', 'expected_loss']

class DecisionInline(admin.StackedInline):
    model = Decision
    extra = 0

class MLCreditAssessmentInline(admin.StackedInline):
    model = MLCreditAssessment
    extra = 0
    readonly_fields = ['credit_score', 'category', 'risk_level', 'confidence', 'prediction_timestamp', 'processing_time_ms']
    fieldsets = (
        ('ML Prediction Results', {
            'fields': ('credit_score', 'category', 'risk_level', 'confidence')
        }),
        ('Ghana Employment Analysis', {
            'fields': ('ghana_job_category', 'ghana_employment_score', 'ghana_job_stability_score'),
            'classes': ('collapse',)
        }),
        ('Model Metadata', {
            'fields': ('model_version', 'model_accuracy', 'prediction_timestamp', 'processing_time_ms'),
            'classes': ('collapse',)
        }),
    )

@admin.register(CreditApplication)
class CreditApplicationAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'status', 'applicant', 'submission_date']
    list_filter = ['status', 'submission_date']
    search_fields = ['reference_number', 'applicant__email']
    inlines = [ApplicantInline, DocumentInline, RiskAssessmentInline, MLCreditAssessmentInline, DecisionInline]
    readonly_fields = ['reference_number']
    
    fieldsets = (
        (None, {
            'fields': ('reference_number', 'status', 'applicant', 'assigned_analyst')
        }),
        ('ML Model Fields', {
            'fields': ('job_title', 'annual_income', 'loan_amount', 'interest_rate', 'debt_to_income_ratio'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('submission_date', 'last_updated'),
            'classes': ('collapse',)
        }),
    )

@admin.register(MLCreditAssessment)
class MLCreditAssessmentAdmin(admin.ModelAdmin):
    list_display = ['application', 'credit_score', 'category', 'risk_level', 'confidence', 'prediction_timestamp']
    list_filter = ['category', 'risk_level', 'model_version', 'prediction_timestamp']
    search_fields = ['application__reference_number', 'ghana_job_category']
    readonly_fields = ['prediction_timestamp', 'processing_time_ms']
    
    fieldsets = (
        ('Application', {
            'fields': ('application',)
        }),
        ('ML Prediction Results', {
            'fields': ('credit_score', 'category', 'risk_level', 'confidence')
        }),
        ('Ghana Employment Analysis', {
            'fields': ('ghana_job_category', 'ghana_employment_score', 'ghana_job_stability_score'),
        }),
        ('Model Metadata', {
            'fields': ('model_version', 'model_accuracy', 'prediction_timestamp', 'processing_time_ms'),
        }),
        ('Technical Details', {
            'fields': ('confidence_factors', 'features_used'),
            'classes': ('collapse',)
        }),
    )