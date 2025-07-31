from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Report, ReportTemplate, ReportSchedule, 
    ReportAccess, ReportKPI, ReportComment
)
from applications.models import CreditApplication
from risk.models import RiskAssessment
from django.db.models import Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    """Simplified user serializer for reports"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'user_type']


class ReportCommentSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    
    class Meta:
        model = ReportComment
        fields = [
            'id', 'user', 'comment', 'is_internal',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ReportAccessSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    
    class Meta:
        model = ReportAccess
        fields = [
            'id', 'user', 'action', 'ip_address', 
            'export_format', 'export_size', 'accessed_at'
        ]


class ReportKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportKPI
        fields = [
            'id', 'name', 'description', 'metric_type',
            'display_format', 'color_scheme', 'chart_type',
            'is_active', 'created_at'
        ]


class ReportTemplateSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'report_type',
            'template_config', 'default_filters', 'created_by',
            'is_public', 'allowed_roles', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ReportScheduleSerializer(serializers.ModelSerializer):
    template = ReportTemplateSerializer(read_only=True)
    template_id = serializers.UUIDField(write_only=True)
    created_by = UserSummarySerializer(read_only=True)
    recipients = UserSummarySerializer(many=True, read_only=True)
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'name', 'template', 'template_id', 'frequency',
            'is_active', 'next_run', 'last_run', 'recipients',
            'recipient_ids', 'email_recipients', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        recipient_ids = validated_data.pop('recipient_ids', [])
        schedule = super().create(validated_data)
        
        if recipient_ids:
            recipients = User.objects.filter(id__in=recipient_ids)
            schedule.recipients.set(recipients)
        
        return schedule


class ReportSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)
    shared_with = UserSummarySerializer(many=True, read_only=True)
    shared_with_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    comments = ReportCommentSerializer(many=True, read_only=True)
    access_logs = ReportAccessSerializer(many=True, read_only=True)
    
    # Computed fields
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id', 'title', 'description', 'report_type', 'status',
            'created_by', 'shared_with', 'shared_with_ids',
            'date_from', 'date_to', 'filters', 'config', 'data', 
            'file_path', 'created_at', 'updated_at', 'generated_at',
            'expires_at', 'views_count', 'downloads_count',
            'comments', 'access_logs', 'can_edit', 'can_delete',
            'is_expired', 'file_size'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'generated_at', 'views_count', 'downloads_count',
            'can_edit', 'can_delete', 'is_expired', 'file_size'
        ]
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        user = request.user
        return (
            obj.created_by == user or 
            user.has_perm('reports.change_report') or
            user.is_superuser
        )
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        user = request.user
        return (
            obj.created_by == user or 
            user.has_perm('reports.delete_report') or
            user.is_superuser
        )
    
    def get_is_expired(self, obj):
        if not obj.expires_at:
            return False
        return timezone.now() > obj.expires_at
    
    def get_file_size(self, obj):
        # This would be implemented to get actual file size
        # For now, return a placeholder
        return None
    
    def create(self, validated_data):
        shared_with_ids = validated_data.pop('shared_with_ids', [])
        report = super().create(validated_data)
        
        if shared_with_ids:
            shared_users = User.objects.filter(id__in=shared_with_ids)
            report.shared_with.set(shared_users)
        
        return report


class ReportGenerationRequestSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    report_type = serializers.ChoiceField(choices=Report.REPORT_TYPES)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    filters = serializers.JSONField(default=dict)
    config = serializers.JSONField(default=dict)
    shared_with_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )
    
    def validate(self, data):
        if data.get('date_from') and data.get('date_to'):
            if data['date_from'] > data['date_to']:
                raise serializers.ValidationError(
                    "date_from must be before date_to"
                )
        return data


class ReportAnalyticsSerializer(serializers.Serializer):
    """Serializer for report analytics and statistics"""
    total_reports = serializers.IntegerField()
    reports_by_type = serializers.DictField()
    reports_by_status = serializers.DictField()
    recent_activity = serializers.ListField()
    top_creators = serializers.ListField()
    popular_reports = serializers.ListField()
    
    # Time-based analytics
    reports_this_month = serializers.IntegerField()
    reports_last_month = serializers.IntegerField()
    growth_rate = serializers.FloatField()
    
    # Usage analytics
    total_views = serializers.IntegerField()
    total_downloads = serializers.IntegerField()
    avg_views_per_report = serializers.FloatField()
    
    def to_representation(self, instance):
        # Generate analytics data
        now = timezone.now()
        last_month = now - timedelta(days=30)
        
        reports_queryset = Report.objects.all()
        
        # Basic counts
        total_reports = reports_queryset.count()
        reports_this_month = reports_queryset.filter(
            created_at__gte=last_month
        ).count()
        reports_last_month = reports_queryset.filter(
            created_at__gte=now - timedelta(days=60),
            created_at__lt=last_month
        ).count()
        
        # Growth rate calculation
        growth_rate = 0
        if reports_last_month > 0:
            growth_rate = ((reports_this_month - reports_last_month) / reports_last_month) * 100
        
        # Reports by type
        reports_by_type = dict(
            reports_queryset.values('report_type').annotate(
                count=Count('id')
            ).values_list('report_type', 'count')
        )
        
        # Reports by status
        reports_by_status = dict(
            reports_queryset.values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        # Usage analytics
        total_views = sum(reports_queryset.values_list('views_count', flat=True))
        total_downloads = sum(reports_queryset.values_list('downloads_count', flat=True))
        avg_views_per_report = total_views / total_reports if total_reports > 0 else 0
        
        # Top creators
        top_creators = list(
            User.objects.filter(
                created_reports__isnull=False
            ).annotate(
                report_count=Count('created_reports')
            ).order_by('-report_count')[:5].values(
                'id', 'first_name', 'last_name', 'report_count'
            )
        )
        
        # Popular reports
        popular_reports = list(
            reports_queryset.order_by('-views_count')[:5].values(
                'id', 'title', 'report_type', 'views_count', 'downloads_count'
            )
        )
        
        # Recent activity
        recent_activity = list(
            ReportAccess.objects.select_related('user', 'report').filter(
                accessed_at__gte=now - timedelta(days=7)
            ).order_by('-accessed_at')[:10].values(
                'action', 'accessed_at', 'user__first_name',
                'user__last_name', 'report__title'
            )
        )
        
        return {
            'total_reports': total_reports,
            'reports_by_type': reports_by_type,
            'reports_by_status': reports_by_status,
            'recent_activity': recent_activity,
            'top_creators': top_creators,
            'popular_reports': popular_reports,
            'reports_this_month': reports_this_month,
            'reports_last_month': reports_last_month,
            'growth_rate': round(growth_rate, 2),
            'total_views': total_views,
            'total_downloads': total_downloads,
            'avg_views_per_report': round(avg_views_per_report, 2),
        }


class RiskAnalyticsSerializer(serializers.Serializer):
    """Serializer for risk-related analytics"""
    
    def to_representation(self, instance):
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        
        # Risk assessment analytics
        assessments = RiskAssessment.objects.filter(
            last_updated__gte=last_30_days
        )
        
        # Risk distribution
        risk_distribution = {}
        for assessment in assessments:
            rating = assessment.risk_rating or 'Unknown'
            risk_distribution[rating] = risk_distribution.get(rating, 0) + 1
        
        # Average risk scores by rating
        avg_scores_by_rating = {}
        for rating in ['Very Low', 'Low', 'Moderate', 'High', 'Very High']:
            avg_score = assessments.filter(
                risk_rating=rating
            ).aggregate(avg_score=Avg('risk_score'))['avg_score']
            if avg_score:
                avg_scores_by_rating[rating] = round(avg_score, 2)
        
        # Applications by status
        applications = CreditApplication.objects.filter(
            created_at__gte=last_30_days
        )
        
        applications_by_status = dict(
            applications.values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        return {
            'risk_distribution': risk_distribution,
            'avg_scores_by_rating': avg_scores_by_rating,
            'applications_by_status': applications_by_status,
            'total_assessments': assessments.count(),
            'total_applications': applications.count(),
        }