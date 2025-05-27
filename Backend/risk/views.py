from rest_framework import generics, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import RiskAssessment, Decision, CreditScore, ModelPrediction, RiskExplanation
from .serializers import (
    RiskAssessmentSerializer,
    DecisionSerializer,
    CreditScoreSerializer,
    ModelPredictionSerializer,
    RiskExplanationSerializer,
    CounterfactualExplanationSerializer
)
from applications.models import CreditApplication

class RiskAssessmentView(generics.RetrieveAPIView):
    serializer_class = RiskAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk']
        )
        return get_object_or_404(
            RiskAssessment,
            application=application
        )

class DecisionView(generics.RetrieveAPIView):
    serializer_class = DecisionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk']
        )
        return get_object_or_404(
            Decision,
            application=application
        )

class CreditScoreListView(generics.ListAPIView):
    serializer_class = CreditScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk']
        )
        return application.applicant_info.credit_scores.all()

class RiskExplanationView(generics.RetrieveAPIView):
    serializer_class = RiskExplanationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk']
        )
        return get_object_or_404(
            RiskExplanation,
            application=application
        )

class CounterfactualView(generics.ListAPIView):
    serializer_class = CounterfactualExplanationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk']
        )
        return application.counterfactuals.all()