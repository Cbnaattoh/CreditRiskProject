from django.contrib import admin
from .models import CreditApplication, Applicant, Document
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

@admin.register(CreditApplication)
class CreditApplicationAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'status', 'applicant', 'submission_date']
    list_filter = ['status', 'submission_date']
    search_fields = ['reference_number', 'applicant__email']
    inlines = [ApplicantInline, DocumentInline, RiskAssessmentInline, DecisionInline]
    readonly_fields = ['reference_number']
    
    fieldsets = (
        (None, {
            'fields': ('reference_number', 'status', 'applicant', 'assigned_analyst')
        }),
        ('Dates', {
            'fields': ('submission_date', 'last_updated'),
            'classes': ('collapse',)
        }),
    )