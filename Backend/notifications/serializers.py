from rest_framework import serializers
from .models import Notification, AuditLog
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'notification_type_display', 
            'title', 'message', 'is_read', 'created_at', 
            'related_object_id', 'related_content_type', 'time_ago'
        ]
        read_only_fields = ['id', 'created_at', 'notification_type_display', 'time_ago']
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)

class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'recipient', 'notification_type', 'title', 'message',
            'related_object_id', 'related_content_type'
        ]

class NotificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['is_read']

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'action', 'action_display', 
            'model', 'object_id', 'ip_address', 'user_agent', 
            'timestamp', 'metadata', 'time_ago'
        ]
        read_only_fields = ['id', 'timestamp', 'user_email', 'action_display', 'time_ago']
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.timestamp)