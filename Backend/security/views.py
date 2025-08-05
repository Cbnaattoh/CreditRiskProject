from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model

from .models import BehavioralBiometrics, SuspiciousActivity
from .serializers import (
    BehavioralBiometricsSerializer, BehavioralBiometricsCreateSerializer,
    SuspiciousActivitySerializer, SuspiciousActivityCreateSerializer,
    SecurityDashboardStatsSerializer, SecurityAlertSerializer,
    BehavioralDataSerializer
)
from users.permissions import IsAdminOrStaff

User = get_user_model()


class BehavioralBiometricsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing behavioral biometrics data"""
    queryset = BehavioralBiometrics.objects.select_related('user').all()
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BehavioralBiometricsCreateSerializer
        return BehavioralBiometricsSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user if specified
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by risk level
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            if risk_level.upper() == 'HIGH':
                queryset = queryset.filter(confidence_score__lt=0.5)
            elif risk_level.upper() == 'MEDIUM':
                queryset = queryset.filter(confidence_score__gte=0.5, confidence_score__lt=0.8)
            elif risk_level.upper() == 'LOW':
                queryset = queryset.filter(confidence_score__gte=0.8)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-last_updated')
    
    @action(detail=False, methods=['get'])
    def high_risk_users(self, request):
        """Get users with high-risk behavioral profiles"""
        high_risk = self.get_queryset().filter(confidence_score__lt=0.5)
        serializer = self.get_serializer(high_risk, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_confidence(self, request, pk=None):
        """Update confidence score for a behavioral profile"""
        biometric = self.get_object()
        new_score = request.data.get('confidence_score')
        
        if new_score is None or not (0 <= float(new_score) <= 1):
            return Response(
                {'error': 'Valid confidence_score (0-1) is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        biometric.confidence_score = float(new_score)
        biometric.save()
        
        serializer = self.get_serializer(biometric)
        return Response(serializer.data)


class SuspiciousActivityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing suspicious activities"""
    queryset = SuspiciousActivity.objects.select_related('user').all()
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SuspiciousActivityCreateSerializer
        return SuspiciousActivitySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by activity type
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type__iexact=activity_type)
        
        # Filter by risk level
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            if risk_level.upper() == 'CRITICAL':
                queryset = queryset.filter(confidence__gte=0.8)
            elif risk_level.upper() == 'HIGH':
                queryset = queryset.filter(confidence__gte=0.6, confidence__lt=0.8)
            elif risk_level.upper() == 'MEDIUM':
                queryset = queryset.filter(confidence__gte=0.3, confidence__lt=0.6)
            elif risk_level.upper() == 'LOW':
                queryset = queryset.filter(confidence__lt=0.3)
        
        # Filter by date range
        days = self.request.query_params.get('days', '30')
        try:
            days = int(days)
            since = timezone.now() - timedelta(days=days)
            queryset = queryset.filter(detected_at__gte=since)
        except ValueError:
            pass
        
        return queryset.order_by('-detected_at')
    
    @action(detail=False, methods=['get'])
    def critical_alerts(self, request):
        """Get critical security alerts"""
        critical = self.get_queryset().filter(confidence__gte=0.8)
        serializer = self.get_serializer(critical, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def activity_summary(self, request):
        """Get summary of activities by type"""
        summary = self.get_queryset().values('activity_type').annotate(
            count=Count('id'),
            avg_confidence=Avg('confidence')
        ).order_by('-count')
        
        return Response(summary)
    
    @action(detail=True, methods=['post'])
    def mark_challenged(self, request, pk=None):
        """Mark an activity as challenged"""
        activity = self.get_object()
        activity.was_challenged = True
        activity.save()
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)


class SecurityDashboardView(APIView):
    """API for security dashboard statistics"""
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get(self, request):
        today = timezone.now().date()
        
        # Calculate statistics
        total_users = User.objects.filter(is_active=True).count()
        behavioral_profiles = BehavioralBiometrics.objects.filter(is_active=True).count()
        
        # High risk users (confidence < 0.5)
        high_risk = BehavioralBiometrics.objects.filter(
            confidence_score__lt=0.5, is_active=True
        ).count()
        
        # Suspicious activities today
        activities_today = SuspiciousActivity.objects.filter(
            detected_at__date=today
        ).count()
        
        # Critical alerts (confidence >= 0.8)
        critical_alerts = SuspiciousActivity.objects.filter(
            confidence__gte=0.8,
            detected_at__date=today
        ).count()
        
        # Average confidence score
        avg_confidence = BehavioralBiometrics.objects.filter(
            is_active=True
        ).aggregate(avg=Avg('confidence_score'))['avg'] or 0
        
        # Top threat types
        threat_types = SuspiciousActivity.objects.filter(
            detected_at__gte=timezone.now() - timedelta(days=7)
        ).values('activity_type').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Recent activities
        recent_activities = SuspiciousActivity.objects.select_related('user').filter(
            detected_at__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-detected_at')[:10]
        
        stats = {
            'total_users_monitored': total_users,
            'high_risk_users': high_risk,
            'suspicious_activities_today': activities_today,
            'critical_alerts': critical_alerts,
            'behavioral_profiles_count': behavioral_profiles,
            'avg_confidence_score': round(avg_confidence, 2),
            'top_threat_types': list(threat_types),
            'recent_activities': SuspiciousActivitySerializer(recent_activities, many=True).data
        }
        
        serializer = SecurityDashboardStatsSerializer(stats)
        return Response(serializer.data)


class SecurityAlertsView(APIView):
    """API for security alerts and notifications"""
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get(self, request):
        # Get critical activities from last 24 hours
        since = timezone.now() - timedelta(hours=24)
        critical_activities = SuspiciousActivity.objects.filter(
            detected_at__gte=since,
            confidence__gte=0.7
        ).select_related('user').order_by('-detected_at')
        
        alerts = []
        for activity in critical_activities:
            severity = 'CRITICAL' if activity.confidence >= 0.8 else 'HIGH'
            
            alerts.append({
                'alert_type': f'SUSPICIOUS_{activity.activity_type}',
                'severity': severity,
                'message': f"Suspicious {activity.get_activity_type_display().lower()} detected for {activity.user.email}",
                'user_email': activity.user.email,
                'timestamp': activity.detected_at,
                'details': activity.details
            })
        
        serializer = SecurityAlertSerializer(alerts, many=True)
        return Response(serializer.data)


class SubmitBehavioralDataView(APIView):
    """Submit behavioral data for analysis"""
    permission_classes = [IsAuthenticated]
    serializer_class = BehavioralDataSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # For now, return mock confidence score
        # In production, this would use the BehavioralAnalyzer service
        typing_data = serializer.validated_data.get('typing', {})
        mouse_data = serializer.validated_data.get('mouse', {})
        
        # Simple confidence calculation based on data completeness
        confidence = 0.5
        if typing_data:
            confidence += 0.3
        if mouse_data:
            confidence += 0.2
            
        confidence = min(confidence, 1.0)
        
        # Update or create behavioral biometrics record
        biometric, created = BehavioralBiometrics.objects.update_or_create(
            user=request.user,
            defaults={
                'typing_pattern': typing_data,
                'mouse_movement': mouse_data,
                'confidence_score': confidence,
                'is_active': True
            }
        )
        
        return Response({
            'confidence_score': confidence,
            'biometric_id': biometric.id,
            'created': created
        })
