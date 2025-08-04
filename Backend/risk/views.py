from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import RiskAssessment, Decision, CreditScore, ModelPrediction, RiskExplanation, CounterfactualExplanation
from .serializers import (
    RiskAssessmentSerializer,
    DecisionSerializer,
    CreditScoreSerializer,
    ModelPredictionSerializer,
    RiskExplanationSerializer,
    CounterfactualExplanationSerializer
)
from applications.models import CreditApplication

class RiskAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Get the application
        application = get_object_or_404(CreditApplication, pk=pk)
        
        try:
            risk_assessment = RiskAssessment.objects.get(application=application)
            serializer = RiskAssessmentSerializer(risk_assessment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RiskAssessment.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

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

class RiskExplanationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Get the application
        application = get_object_or_404(CreditApplication, pk=pk)
        
        try:
            risk_explanation = RiskExplanation.objects.get(application=application)
            serializer = RiskExplanationSerializer(risk_explanation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RiskExplanation.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

class CounterfactualView(generics.ListAPIView):
    serializer_class = CounterfactualExplanationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application = get_object_or_404(
            CreditApplication,
            pk=self.kwargs['pk']
        )
        return application.counterfactuals.all()


class RiskAnalysisView(APIView):
    """
    Comprehensive risk analysis view that provides all risk-related data for an application
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Get the application
        application = get_object_or_404(CreditApplication, pk=pk)
        
        # Prepare the response data
        data = {}
        
        # Get risk assessment
        try:
            risk_assessment = RiskAssessment.objects.get(application=application)
            data['risk_assessment'] = RiskAssessmentSerializer(risk_assessment).data
        except RiskAssessment.DoesNotExist:
            data['risk_assessment'] = None
        
        # Get risk explanation
        try:
            risk_explanation = RiskExplanation.objects.get(application=application)
            data['risk_explanation'] = RiskExplanationSerializer(risk_explanation).data
        except RiskExplanation.DoesNotExist:
            data['risk_explanation'] = None
        
        # Get model predictions
        model_predictions = ModelPrediction.objects.filter(application=application)
        data['model_predictions'] = ModelPredictionSerializer(model_predictions, many=True).data
        
        # Get counterfactual explanations
        counterfactuals = CounterfactualExplanation.objects.filter(application=application)
        data['counterfactuals'] = CounterfactualExplanationSerializer(counterfactuals, many=True).data
        
        # Get credit scores (if available)
        if hasattr(application, 'applicant_info') and application.applicant_info:
            credit_scores = application.applicant_info.credit_scores.all()
            data['credit_scores'] = CreditScoreSerializer(credit_scores, many=True).data
        else:
            data['credit_scores'] = []
        
        # Get decision
        try:
            decision = Decision.objects.get(application=application)
            data['decision'] = DecisionSerializer(decision).data
        except Decision.DoesNotExist:
            data['decision'] = None
        
        return Response(data, status=status.HTTP_200_OK)


class ModelPredictionListView(generics.ListAPIView):
    """
    List model predictions filtered by application
    """
    serializer_class = ModelPredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application_id = self.request.query_params.get('application')
        if application_id:
            application = get_object_or_404(CreditApplication, pk=application_id)
            return ModelPrediction.objects.filter(application=application)
        return ModelPrediction.objects.none()


class CounterfactualListView(generics.ListAPIView):
    """
    List counterfactual explanations filtered by application
    """
    serializer_class = CounterfactualExplanationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        application_id = self.request.query_params.get('application')
        if application_id:
            application = get_object_or_404(CreditApplication, pk=application_id)
            return CounterfactualExplanation.objects.filter(application=application)
        return CounterfactualExplanation.objects.none()