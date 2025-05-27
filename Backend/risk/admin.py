from django.contrib import admin
from .models import (
    RiskAssessment, RiskFactor, Decision,
    CreditScore, ModelPrediction,
    RiskExplanation, CounterfactualExplanation
)


class RiskFactorInline(admin.TabularInline):
    model = RiskFactor
    extra = 0
    readonly_fields = ('factor_name', 'factor_weight', 'factor_score', 'weighted_score', 'notes')
    can_delete = False
    show_change_link = False


@admin.register(RiskAssessment)
class RiskAssessmentAdmin(admin.ModelAdmin):
    list_display = ('application', 'risk_score', 'risk_rating', 'probability_of_default', 'expected_loss', 'last_updated', 'reviewed_by')
    list_filter = ('risk_rating', 'last_updated', 'reviewed_by')
    search_fields = ('application__reference_number', 'review_notes')
    readonly_fields = ('last_updated', 'risk_rating')
    inlines = [RiskFactorInline]


@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    list_display = ('application', 'decision', 'decision_date', 'decision_by', 'amount_approved', 'interest_rate', 'term_months')
    list_filter = ('decision', 'decision_date', 'decision_by')
    search_fields = ('application__reference_number', 'conditions', 'notes')
    readonly_fields = ('decision_date',)


@admin.register(CreditScore)
class CreditScoreAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'score_type', 'score', 'report_date', 'provider')
    list_filter = ('score_type', 'report_date', 'provider')
    search_fields = ('applicant__full_name', 'provider')
    ordering = ('-report_date',)


@admin.register(ModelPrediction)
class ModelPredictionAdmin(admin.ModelAdmin):
    list_display = ('application', 'model_version', 'prediction_date', 'confidence')
    list_filter = ('model_version', 'prediction_date')
    search_fields = ('application__reference_number',)
    readonly_fields = ('prediction_date', 'prediction')


@admin.register(RiskExplanation)
class RiskExplanationAdmin(admin.ModelAdmin):
    list_display = ('application', 'generated_at')
    readonly_fields = ('generated_at', 'summary', 'key_factors', 'visualizations')
    search_fields = ('application__reference_number',)
    ordering = ('-generated_at',)


@admin.register(CounterfactualExplanation)
class CounterfactualExplanationAdmin(admin.ModelAdmin):
    list_display = ('application', 'scenario', 'original_score', 'projected_score', 'probability_change', 'created_at')
    readonly_fields = ('created_at', 'score_change', 'improvement_percentage')
    search_fields = ('application__reference_number', 'scenario', 'explanation')
    ordering = ('-created_at',)
