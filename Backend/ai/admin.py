from django.contrib import admin
from .models import AIModelVersion, ModelTrainingLog, FeatureImportance

@admin.register(AIModelVersion)
class AIModelVersionAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'model_type',
        'version',
        'is_active',
        'created_at',
    )
    list_filter = ('model_type', 'is_active', 'created_at')
    search_fields = ('name', 'version')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(ModelTrainingLog)
class ModelTrainingLogAdmin(admin.ModelAdmin):
    list_display = (
        'model_version',
        'status',
        'started_at',
        'completed_at',
        'training_data_size',
    )
    list_filter = ('status', 'started_at')
    search_fields = ('model_version__name',)
    readonly_fields = ('duration',)


@admin.register(FeatureImportance)
class FeatureImportanceAdmin(admin.ModelAdmin):
    list_display = (
        'model_version',
        'feature_name',
        'importance_score',
        'direction',
    )
    list_filter = ('model_version', 'direction')
    search_fields = ('feature_name', 'model_version__name')
