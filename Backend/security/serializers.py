from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import BehavioralBiometrics, SuspiciousActivity

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for security tables"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'user_type', 'is_active']


class BehavioralBiometricsSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    risk_level = serializers.SerializerMethodField()
    
    class Meta:
        model = BehavioralBiometrics
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'typing_pattern', 'mouse_movement', 'device_interaction',
            'last_updated', 'confidence_score', 'is_active', 'risk_level'
        ]
        read_only_fields = ['id', 'last_updated']
    
    def get_risk_level(self, obj):
        """Calculate risk level based on confidence score"""
        if obj.confidence_score >= 0.8:
            return 'LOW'
        elif obj.confidence_score >= 0.5:
            return 'MEDIUM'
        else:
            return 'HIGH'


class BehavioralBiometricsCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = BehavioralBiometrics
        fields = [
            'user_id', 'typing_pattern', 'mouse_movement', 
            'device_interaction', 'confidence_score', 'is_active'
        ]
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        user = User.objects.get(id=user_id)
        return BehavioralBiometrics.objects.create(user=user, **validated_data)


class SuspiciousActivitySerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    risk_level = serializers.SerializerMethodField()
    formatted_details = serializers.SerializerMethodField()
    
    class Meta:
        model = SuspiciousActivity
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'activity_type', 'activity_type_display', 'detected_at',
            'ip_address', 'user_agent', 'confidence', 'details',
            'formatted_details', 'was_challenged', 'was_successful', 'risk_level'
        ]
        read_only_fields = ['id', 'detected_at']
    
    def get_risk_level(self, obj):
        """Calculate risk level based on confidence and success"""
        if obj.confidence >= 0.8:
            return 'CRITICAL'
        elif obj.confidence >= 0.6:
            return 'HIGH' 
        elif obj.confidence >= 0.3:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def get_formatted_details(self, obj):
        """Format details for better frontend display"""
        # Handle both model instances and dictionary objects
        if hasattr(obj, 'details'):
            details = obj.details
        else:
            details = obj.get('details', {}) if isinstance(obj, dict) else {}
            
        if not details:
            return {}
        
        formatted = {}
        for key, value in details.items():
            # Convert snake_case to Title Case
            formatted_key = key.replace('_', ' ').title()
            formatted[formatted_key] = value
        
        return formatted


class SuspiciousActivityCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SuspiciousActivity
        fields = [
            'user_id', 'activity_type', 'ip_address', 'user_agent',
            'confidence', 'details', 'was_challenged', 'was_successful'
        ]
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id')
        user = User.objects.get(id=user_id)
        return SuspiciousActivity.objects.create(user=user, **validated_data)


class ThreatTypeSerializer(serializers.Serializer):
    """Serializer for threat type statistics"""
    activity_type = serializers.CharField()
    count = serializers.IntegerField()


class SecurityDashboardStatsSerializer(serializers.Serializer):
    """Serializer for security dashboard statistics"""
    total_users_monitored = serializers.IntegerField()
    high_risk_users = serializers.IntegerField()
    suspicious_activities_today = serializers.IntegerField()
    critical_alerts = serializers.IntegerField()
    behavioral_profiles_count = serializers.IntegerField()
    avg_confidence_score = serializers.FloatField()
    top_threat_types = ThreatTypeSerializer(many=True, read_only=True)
    recent_activities = SuspiciousActivitySerializer(many=True, read_only=True)


class SecurityAlertSerializer(serializers.Serializer):
    """Serializer for security alerts and notifications"""
    alert_type = serializers.CharField()
    severity = serializers.CharField() 
    message = serializers.CharField()
    user_email = serializers.CharField()
    timestamp = serializers.DateTimeField()
    details = serializers.JSONField()


class BehavioralDataSerializer(serializers.Serializer):
    typing = serializers.DictField(required=False)
    mouse = serializers.DictField(required=False)