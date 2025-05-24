from rest_framework import serializers
from .models import RiskAssessment, RiskFactor, Decision, CreditScore, ModelPrediction
from applications.models import CreditApplication

class RiskFactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskFactor
        fields = '__all__'
        read_only_fields = ['assessment']

class RiskAssessmentSerializer(serializers.ModelSerializer):
    factors = RiskFactorSerializer(many=True, read_only=True)
    risk_rating = serializers.CharField(source='get_risk_rating_display', read_only=True)
    
    class Meta:
        model = RiskAssessment
        fields = '__all__'
        read_only_fields = ['application', 'risk_score', 'probability_of_default', 
                          'expected_loss', 'last_updated', 'reviewed_by']

class DecisionSerializer(serializers.ModelSerializer):
    decision_display = serializers.CharField(source='get_decision_display', read_only=True)
    
    class Meta:
        model = Decision
        fields = '__all__'
        read_only_fields = ['application', 'decision_date', 'decision_by']

class CreditScoreSerializer(serializers.ModelSerializer):
    score_type_display = serializers.CharField(source='get_score_type_display', read_only=True)
    
    class Meta:
        model = CreditScore
        fields = '__all__'
        read_only_fields = ['applicant']

class ModelPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelPrediction
        fields = '__all__'
        read_only_fields = ['application']

class RiskExplanationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskExplanation
        fields = '__all__'
        read_only_fields = ['application']

class CounterfactualExplanationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CounterfactualExplanation
        fields = '__all__'
        read_only_fields = ['application']