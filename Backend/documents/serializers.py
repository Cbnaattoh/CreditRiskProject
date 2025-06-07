from rest_framework import serializers
from .models import DocumentAnalysis, OCRResult
from applications.models import Document

class DocumentAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentAnalysis
        fields = '__all__'
        read_only_fields = ['document']

class OCRResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = OCRResult
        fields = '__all__'
        read_only_fields = ['document']



class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['document_type', 'file']

    def create(self, validated_data):
        application = self.context['application']
        return Document.objects.create(application=application, **validated_data)
    

class DocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'document_type', 'document_type_display', 'file',
            'uploaded_at', 'verified', 'verification_notes'
        ]

