# documents/models.py
from django.db import models
from applications.models import Document
from django.core.validators import MinValueValidator, MaxValueValidator

class DocumentAnalysis(models.Model):
    document = models.OneToOneField(
        Document,
        on_delete=models.CASCADE,
        related_name='analysis'
    )
    analysis_date = models.DateTimeField(auto_now_add=True)
    is_authentic = models.BooleanField(default=False)
    is_tampered = models.BooleanField(default=False)
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    metadata_extracted = models.JSONField(default=dict)
    anomalies = models.JSONField(default=list)
    processing_time_ms = models.IntegerField()
    
    class Meta:
        verbose_name_plural = "Document Analyses"
    
    def __str__(self):
        return f"Analysis of {self.document}"

class OCRResult(models.Model):
    document = models.OneToOneField(
        Document,
        on_delete=models.CASCADE,
        related_name='ocr_result'
    )
    extracted_text = models.TextField()
    confidence = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    processed_fields = models.JSONField(default=dict)
    raw_output = models.JSONField(default=dict)
    
    def __str__(self):
        return f"OCR for {self.document}"