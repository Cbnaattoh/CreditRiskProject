from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import Notification, AuditLog
from .serializers import (
    NotificationSerializer, 
    NotificationCreateSerializer, 
    NotificationUpdateSerializer,
    AuditLogSerializer
)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for the current user"""
        return Notification.objects.filter(recipient=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NotificationUpdateSerializer
        return NotificationSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new notification (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff can create notifications'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True
        )
        return Response({'updated': updated})
    
    @action(detail=False, methods=['delete'])
    def clear_read(self, request):
        """Delete all read notifications"""
        deleted_count = self.get_queryset().filter(is_read=True).count()
        self.get_queryset().filter(is_read=True).delete()
        return Response({'deleted': deleted_count})
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent notifications (last 30 days for better UX)"""
        # Increase from 7 to 30 days for better user experience
        days_ago = timezone.now() - timedelta(days=30)
        notifications = self.get_queryset().filter(created_at__gte=days_ago)[:20]
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ml_notifications(self, request):
        """Get ML processing related notifications"""
        ml_types = [
            'ML_PROCESSING_STARTED',
            'ML_PROCESSING_COMPLETED', 
            'ML_PROCESSING_FAILED',
            'CREDIT_SCORE_GENERATED'
        ]
        notifications = self.get_queryset().filter(
            notification_type__in=ml_types
        ).order_by('-created_at')[:50]
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ml_status(self, request):
        """Get ML processing status summary"""
        ml_notifications = self.get_queryset().filter(
            notification_type__in=[
                'ML_PROCESSING_STARTED',
                'ML_PROCESSING_COMPLETED', 
                'ML_PROCESSING_FAILED',
                'CREDIT_SCORE_GENERATED'
            ],
            created_at__gte=timezone.now() - timedelta(hours=24)
        )
        
        status_summary = {
            'processing': ml_notifications.filter(
                notification_type='ML_PROCESSING_STARTED'
            ).count(),
            'completed': ml_notifications.filter(
                notification_type__in=['ML_PROCESSING_COMPLETED', 'CREDIT_SCORE_GENERATED']
            ).count(),
            'failed': ml_notifications.filter(
                notification_type='ML_PROCESSING_FAILED'
            ).count(),
            'total': ml_notifications.count()
        }
        
        return Response(status_summary)
    

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return audit logs - admin sees all, users see their own"""
        if self.request.user.is_staff:
            return AuditLog.objects.all()
        return AuditLog.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent audit logs"""
        logs = self.get_queryset()[:50]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_action(self, request):
        """Filter audit logs by action type"""
        action_type = request.query_params.get('action')
        if not action_type:
            return Response({'error': 'action parameter required'}, status=400)
        
        logs = self.get_queryset().filter(action=action_type.upper())
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)

def send_notification_to_user(user_id, notification_data):
    """
    Send real-time notification to a user via WebSocket
    """
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'notifications_{user_id}',
            {
                'type': 'notify',
                'data': notification_data
            }
        )

def create_notification(recipient, notification_type, title, message, 
                       related_object_id=None, related_content_type=None, 
                       send_realtime=True):
    """
    Helper function to create and optionally send real-time notifications
    """
    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        related_object_id=related_object_id,
        related_content_type=related_content_type
    )
    
    if send_realtime:
        # Send real-time notification
        notification_data = NotificationSerializer(notification).data
        send_notification_to_user(recipient.id, notification_data)
    
    return notification
