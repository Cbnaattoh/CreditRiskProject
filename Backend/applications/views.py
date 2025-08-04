from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CreditApplication, Document, ApplicationNote
from .serializers import (
    CreditApplicationSerializer,
    DocumentSerializer,
    ApplicationNoteSerializer,
    ApplicationSubmitSerializer
)
from risk.models import RiskAssessment
from risk.services import RiskEngine
import uuid

class ApplicationListView(generics.ListCreateAPIView):
    serializer_class = CreditApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type in ['ADMIN', 'ANALYST']:
            return CreditApplication.objects.all().order_by('-last_updated')
        return user.applications.all().order_by('-last_updated')

    def perform_create(self, serializer):
        """
        INDUSTRY STANDARD FIX: Override perform_create for additional safety
        """
        # Ensure authenticated user is set as applicant
        serializer.save(applicant=self.request.user)

class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CreditApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        user = self.request.user
        if user.user_type in ['ADMIN', 'ANALYST']:
            return CreditApplication.objects.all()
        return user.applications.all()

class ApplicationSubmitView(generics.GenericAPIView):
    serializer_class = ApplicationSubmitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        application = get_object_or_404(
            CreditApplication,
            pk=kwargs['pk'],
            applicant=request.user
        )
        
        if application.status != 'DRAFT':
            return Response(
                {'detail': 'Application has already been submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Submit the application
        application.status = 'SUBMITTED'
        application.save()
        
        # Trigger risk assessment
        risk_engine = RiskEngine()
        risk_engine.calculate_risk(application)
        
        return Response(
            {'status': 'Application submitted successfully'},
            status=status.HTTP_200_OK
        )

class DocumentListView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application_id = self.kwargs['pk']
        return Document.objects.filter(application_id=application_id)

    def perform_create(self, serializer):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk'],
            applicant=self.request.user
        )
        serializer.save(application=application)

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    lookup_url_kwarg = 'doc_pk'

    def get_queryset(self):
        application_id = self.kwargs['pk']
        return Document.objects.filter(application_id=application_id)

class ApplicationNoteListView(generics.ListCreateAPIView):
    serializer_class = ApplicationNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application_id = self.kwargs['pk']
        return ApplicationNote.objects.filter(application_id=application_id)

    def perform_create(self, serializer):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk']
        )
        serializer.save(application=application, author=self.request.user)