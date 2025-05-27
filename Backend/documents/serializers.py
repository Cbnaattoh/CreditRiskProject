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

class DocumentUploadSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=Document.DOCUMENT_TYPES)
    file = serializers.FileField()
    
    def create(self, validated_data):
        application = self.context['application']
        return Document.objects.create(
            application=application,
            **validated_data
        )