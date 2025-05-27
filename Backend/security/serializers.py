from rest_framework import serializers
from .models import BehavioralBiometrics, SuspiciousActivity

class BehavioralBiometricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehavioralBiometrics
        fields = '__all__'
        read_only_fields = ['user', 'last_updated']

class SuspiciousActivitySerializer(serializers.ModelSerializer):
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    
    class Meta:
        model = SuspiciousActivity
        fields = '__all__'
        read_only_fields = ['user', 'detected_at', 'was_challenged', 'was_successful']