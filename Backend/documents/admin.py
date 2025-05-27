from django.contrib import admin
from .models import DocumentAnalysis, OCRResult

@admin.register(DocumentAnalysis)
class DocumentAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        'document',
        'analysis_date',
        'is_authentic',
        'is_tampered',
        'confidence_score',
        'processing_time_ms',
    )
    list_filter = ('is_authentic', 'is_tampered', 'analysis_date')
    search_fields = ('document__id', 'document__document_type')
    readonly_fields = ('analysis_date',)

@admin.register(OCRResult)
class OCRResultAdmin(admin.ModelAdmin):
    list_display = (
        'document',
        'confidence',
    )
    search_fields = ('document__id', 'document__document_type')
    readonly_fields = ('extracted_text', 'confidence', 'processed_fields', 'raw_output')
