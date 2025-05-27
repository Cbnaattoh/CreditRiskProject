from rest_framework import serializers
from .models import AIModelVersion, ModelTrainingLog, FeatureImportance

class FeatureImportanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureImportance
        fields = '__all__'
        read_only_fields = ['model_version']

class ModelTrainingLogSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()

    class Meta:
        model = ModelTrainingLog
        fields = '__all__'
        read_only_fields = ['model_version']

    def get_duration(self, obj):
        if obj.completed_at:
            return (obj.completed_at - obj.started_at).total_seconds()
        return None
    
class AIModelVersionSerializer(serializers.ModelSerializer):
    model_type_display = serializers.CharField(source='get_model_type_display', read_only=True)
    training_logs = ModelTrainingLogSerializer(many=True, read_only=True)
    features = FeatureImportanceSerializer(many=True, read_only=True)

    class Meta:
        model = AIModelVersion
        fields = '__all__'
        