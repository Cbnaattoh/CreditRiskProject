from django.contrib import admin
from .models import (
    CreditApplication, 
    Applicant, 
    Document, 
    MLCreditAssessment,
    ApplicationReview,
    ApplicationStatusHistory,
    ApplicationActivity,
    ApplicationComment
)
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


# New admin registrations for application tracking models

@admin.register(ApplicationReview)
class ApplicationReviewAdmin(admin.ModelAdmin):
    list_display = ['application', 'reviewer', 'review_status', 'decision', 'created_at']
    list_filter = ['review_status', 'decision', 'created_at', 'requires_second_opinion']
    search_fields = ['application__reference_number', 'reviewer__email', 'reviewer__first_name', 'reviewer__last_name']
    readonly_fields = ['created_at', 'updated_at', 'review_started_at', 'review_completed_at']
    
    fieldsets = (
        ('Application & Reviewer', {
            'fields': ('application', 'reviewer', 'review_status', 'decision')
        }),
        ('Review Assessment', {
            'fields': ('risk_assessment_score', 'creditworthiness_rating', 'estimated_processing_days')
        }),
        ('Review Details', {
            'fields': ('general_remarks', 'strengths', 'concerns', 'recommendation')
        }),
        ('Information Requests', {
            'fields': ('additional_info_required', 'documents_required'),
            'classes': ('collapse',)
        }),
        ('Quality Assurance', {
            'fields': ('requires_second_opinion', 'second_reviewer', 'second_review_comments'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('review_started_at', 'review_completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['application', 'previous_status', 'new_status', 'changed_by', 'changed_at', 'system_generated']
    list_filter = ['new_status', 'previous_status', 'system_generated', 'changed_at']
    search_fields = ['application__reference_number', 'changed_by__email']
    readonly_fields = ['changed_at']
    
    fieldsets = (
        ('Status Change', {
            'fields': ('application', 'previous_status', 'new_status', 'reason')
        }),
        ('Change Metadata', {
            'fields': ('changed_by', 'changed_at', 'system_generated')
        }),
    )


@admin.register(ApplicationActivity)
class ApplicationActivityAdmin(admin.ModelAdmin):
    list_display = ['application', 'activity_type', 'user', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['application__reference_number', 'user__email', 'description']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Activity Details', {
            'fields': ('application', 'activity_type', 'user', 'description')
        }),
        ('Additional Data', {
            'fields': ('metadata', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ApplicationComment)
class ApplicationCommentAdmin(admin.ModelAdmin):
    list_display = ['application', 'author', 'comment_type', 'created_at', 'is_read']
    list_filter = ['comment_type', 'is_read', 'created_at']
    search_fields = ['application__reference_number', 'author__email', 'content']
    readonly_fields = ['created_at', 'updated_at', 'read_at', 'read_by']
    
    fieldsets = (
        ('Comment Details', {
            'fields': ('application', 'author', 'comment_type', 'content', 'parent_comment')
        }),
        ('File Attachment', {
            'fields': ('attachment',),
            'classes': ('collapse',)
        }),
        ('Read Status', {
            'fields': ('is_read', 'read_at', 'read_by'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )