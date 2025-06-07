from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import DocumentAnalysis, OCRResult
from .serializers import (
    DocumentAnalysisSerializer,
    OCRResultSerializer,
    DocumentUploadSerializer,
    DocumentSerializer
)
from .services import DocumentVerifier
from applications.models import Document, CreditApplication

class DocumentAnalyzeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentAnalysisSerializer
    
    def post(self, request, *args, **kwargs):
        document = get_object_or_404(
            Document,
            pk=kwargs['pk'],
            application__applicant=request.user
        )
        
        verifier = DocumentVerifier()
        analysis = verifier.analyze_document(document)
        
        serializer = DocumentAnalysisSerializer(analysis)
        return Response(serializer.data, status=status.HTTP_200_OK)

class OCRResultView(generics.RetrieveAPIView):
    serializer_class = OCRResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        document = get_object_or_404(
            Document,
            pk=self.kwargs['pk']
        )
        return get_object_or_404(
            OCRResult,
            document=document
        )

class DocumentUploadView(generics.CreateAPIView):
    serializer_class = DocumentUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        application = get_object_or_404(
            CreditApplication,
            pk=kwargs['pk'],
            applicant=request.user
        )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.context['application'] = application
        document = serializer.save()
        
        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )