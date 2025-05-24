import pytesseract
from PIL import Image
import requests
from io import BytesIO
import numpy as np
from django.conf import settings
from .models import DocumentAnalysis, OCRResult
import cv2
import json

class DocumentVerifier:
    def __init__(self):
        self.template_matcher = settings.DOCUMENT_TEMPLATES
        self.api_key = settings.DOCUMENT_VERIFICATION_API_KEY
    
    def analyze_document(self, document):
        # Step 1: Basic verification
        analysis = self._perform_basic_analysis(document)
        
        # Step 2: OCR processing
        ocr_result = self._perform_ocr(document)
        
        # Step 3: Advanced verification (if enabled)
        if settings.ADVANCED_DOCUMENT_VERIFICATION:
            advanced_results = self._advanced_verification(document)
            analysis.metadata_extracted.update(advanced_results.get('metadata', {}))
            analysis.anomalies = advanced_results.get('anomalies', [])
            analysis.is_authentic = advanced_results.get('is_authentic', False)
            analysis.is_tampered = advanced_results.get('is_tampered', False)
        
        analysis.save()
        return analysis
    
    def _perform_basic_analysis(self, document):
        # Basic checks like file type, size, etc.
        analysis = DocumentAnalysis.objects.create(
            document=document,
            is_authentic=False,
            is_tampered=False,
            confidence_score=0,
            metadata_extracted={},
            anomalies=[],
            processing_time_ms=0
        )
        
        # Add basic metadata
        analysis.metadata_extracted = {
            'file_type': document.file.name.split('.')[-1],
            'file_size': document.file.size,
        }
        
        return analysis
    
    def _perform_ocr(self, document):
        # Extract text from document
        try:
            if document.file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
                img = Image.open(document.file)
                text = pytesseract.image_to_string(img)
                
                # Simple field extraction (customize based on your needs)
                extracted_fields = {
                    'name': self._extract_field(text, ['name', 'full name']),
                    'id_number': self._extract_field(text, ['id', 'identification']),
                    # Add more fields as needed
                }
                
                ocr_result = OCRResult.objects.create(
                    document=document,
                    extracted_text=text,
                    confidence=0.9,  # Would be calculated in real implementation
                    processed_fields=extracted_fields,
                    raw_output={'text': text}
                )
                
                return ocr_result
                
        except Exception as e:
            # Handle errors appropriately
            return None
    
    def _extract_field(self, text, keywords):
        # Simple field extraction logic
        for line in text.split('\n'):
            for keyword in keywords:
                if keyword.lower() in line.lower():
                    return line.split(':')[-1].strip()
        return None
    
    def _advanced_verification(self, document):
        # This would integrate with third-party services in a real implementation
        # For example, using Onfido, Jumio, or other document verification services
        
        # Mock implementation
        return {
            'is_authentic': True,
            'is_tampered': False,
            'metadata': {
                'name': 'John Doe',
                'dob': '1985-01-15',
                'document_type': 'DRIVER_LICENSE'
            },
            'anomalies': []
        }