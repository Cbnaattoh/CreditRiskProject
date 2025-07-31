from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, Http404
from django.utils import timezone
from django.db.models import Q, F
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import (
    Report, ReportTemplate, ReportSchedule,
    ReportAccess, ReportKPI, ReportComment
)
from .serializers import (
    ReportSerializer, ReportTemplateSerializer, ReportScheduleSerializer,
    ReportAccessSerializer, ReportKPISerializer, ReportCommentSerializer,
    ReportGenerationRequestSerializer, ReportAnalyticsSerializer,
    RiskAnalyticsSerializer
)
from .services import ReportGenerationService, ReportExportService
from users.permissions import RBACPermission


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reports with RBAC integration
    """
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_permissions = {
        'list': ['report_view'],
        'retrieve': ['report_view'],
        'create': ['report_create'],
        'update': ['report_edit'],
        'partial_update': ['report_edit'],
        'destroy': ['report_delete'],
        'generate': ['report_create'],
        'export': ['report_view', 'data_export'],
        'share': ['report_share'],
        'analytics': ['report_admin'],
        'my_reports': ['report_view'],
    }
    
    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.all()
        
        # Filter based on user permissions
        if not user.has_perm('report_admin'):
            queryset = queryset.filter(
                Q(created_by=user) | Q(shared_with=user)
            ).distinct()
        
        # Apply filters
        report_type = self.request.query_params.get('type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to track views"""
        instance = self.get_object()
        
        # Track view
        ReportAccess.objects.create(
            report=instance,
            user=request.user,
            action='VIEW',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Increment view count
        Report.objects.filter(id=instance.id).update(
            views_count=F('views_count') + 1
        )
        
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        request=ReportGenerationRequestSerializer,
        responses={201: ReportSerializer}
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new report"""
        serializer = ReportGenerationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create report instance
        report = Report.objects.create(
            title=serializer.validated_data['title'],
            description=serializer.validated_data.get('description', ''),
            report_type=serializer.validated_data['report_type'],
            date_from=serializer.validated_data.get('date_from'),
            date_to=serializer.validated_data.get('date_to'),
            filters=serializer.validated_data.get('filters', {}),
            config=serializer.validated_data.get('config', {}),
            created_by=request.user,
            status='GENERATING'
        )
        
        # Add shared users
        shared_with_ids = serializer.validated_data.get('shared_with_ids', [])
        if shared_with_ids:
            report.shared_with.set(shared_with_ids)
        
        # Start generation process
        try:
            report_service = ReportGenerationService()
            report_service.generate_report_async(report.id)
            
            response_serializer = ReportSerializer(report, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            report.status = 'FAILED'
            report.save()
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='format',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Export format (pdf, excel, csv)',
                enum=['pdf', 'excel', 'csv']
            )
        ]
    )
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export report in various formats"""
        report = self.get_object()
        export_format = request.query_params.get('format', 'pdf')
        
        if export_format not in ['pdf', 'excel', 'csv']:
            return Response(
                {'error': 'Invalid format. Supported: pdf, excel, csv'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            export_service = ReportExportService()
            file_content, content_type, filename = export_service.export_report(
                report, export_format
            )
            
            # Track download
            ReportAccess.objects.create(
                report=report,
                user=request.user,
                action='DOWNLOAD',
                export_format=export_format,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Increment download count
            Report.objects.filter(id=report.id).update(
                downloads_count=F('downloads_count') + 1
            )
            
            response = HttpResponse(file_content, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        except Exception as e:
            return Response(
                {'error': f'Export failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share report with other users"""
        report = self.get_object()
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response(
                {'error': 'No user IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add users to shared_with
        report.shared_with.add(*user_ids)
        
        # Track share action
        ReportAccess.objects.create(
            report=report,
            user=request.user,
            action='SHARE',
            ip_address=self.get_client_ip(request)
        )
        
        return Response({'message': 'Report shared successfully'})
    
    @extend_schema(responses={200: ReportAnalyticsSerializer})
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get report analytics and statistics"""
        serializer = ReportAnalyticsSerializer({})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Get current user's reports"""
        reports = self.get_queryset().filter(created_by=request.user)
        page = self.paginate_queryset(reports)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing report templates
    """
    serializer_class = ReportTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_permissions = {
        'list': ['report_view'],
        'retrieve': ['report_view'], 
        'create': ['report_template_create'],
        'update': ['report_template_edit'],
        'partial_update': ['report_template_edit'],
        'destroy': ['report_template_delete'],
    }
    
    def get_queryset(self):
        user = self.request.user
        queryset = ReportTemplate.objects.all()
        
        # Filter based on permissions and access
        if not user.has_perm('report_admin'):
            queryset = queryset.filter(
                Q(created_by=user) | 
                Q(is_public=True) |
                Q(allowed_roles__contains=[user.user_type])
            ).distinct()
        
        return queryset.order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ReportScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing scheduled reports
    """
    serializer_class = ReportScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_permissions = {
        'list': ['report_schedule_view'],
        'retrieve': ['report_schedule_view'],
        'create': ['report_schedule_create'],
        'update': ['report_schedule_edit'],
        'partial_update': ['report_schedule_edit'],
        'destroy': ['report_schedule_delete'],
    }
    
    def get_queryset(self):
        user = self.request.user
        queryset = ReportSchedule.objects.all()
        
        if not user.has_perm('report_admin'):
            queryset = queryset.filter(created_by=user)
        
        return queryset.order_by('next_run')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ReportKPIViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for report KPIs (read-only for now)
    """
    serializer_class = ReportKPISerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_permissions = {
        'list': ['report_view'],
        'retrieve': ['report_view'],
    }
    
    def get_queryset(self):
        return ReportKPI.objects.filter(is_active=True).order_by('name')


@extend_schema(tags=['Reports'])
class ReportAnalyticsView(viewsets.GenericViewSet):
    """
    ViewSet for analytics endpoints
    """
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_permissions = {
        'risk_analytics': ['report_view', 'risk_view'],
        'dashboard_data': ['report_view'],
    }
    
    @extend_schema(responses={200: RiskAnalyticsSerializer})
    @action(detail=False, methods=['get'])
    def risk_analytics(self, request):
        """Get risk-related analytics data"""
        serializer = RiskAnalyticsSerializer({})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Get dashboard data for reports overview"""
        user = request.user
        
        # Get user's accessible reports
        if user.has_perm('report_admin'):
            reports = Report.objects.all()
        else:
            reports = Report.objects.filter(
                Q(created_by=user) | Q(shared_with=user)
            ).distinct()
        
        # Basic statistics
        total_reports = reports.count()
        pending_reports = reports.filter(status='PENDING').count()
        completed_reports = reports.filter(status='COMPLETED').count()
        failed_reports = reports.filter(status='FAILED').count()
        
        # Recent reports
        recent_reports = ReportSerializer(
            reports.order_by('-created_at')[:5],
            many=True,
            context={'request': request}
        ).data
        
        # Reports by type
        reports_by_type = {}
        for report_type, display_name in Report.REPORT_TYPES:
            count = reports.filter(report_type=report_type).count()
            if count > 0:
                reports_by_type[report_type] = {
                    'name': display_name,
                    'count': count
                }
        
        return Response({
            'total_reports': total_reports,
            'pending_reports': pending_reports,
            'completed_reports': completed_reports,
            'failed_reports': failed_reports,
            'recent_reports': recent_reports,
            'reports_by_type': reports_by_type,
        })


class ReportCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for report comments
    """
    serializer_class = ReportCommentSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_permissions = {
        'list': ['report_view'],
        'create': ['report_comment'],
        'update': ['report_comment'],
        'destroy': ['report_comment'],
    }
    
    def get_queryset(self):
        report_id = self.kwargs.get('report_pk')
        if report_id:
            return ReportComment.objects.filter(
                report_id=report_id
            ).order_by('-created_at')
        return ReportComment.objects.none()
    
    def perform_create(self, serializer):
        report_id = self.kwargs.get('report_pk')
        report = get_object_or_404(Report, id=report_id)
        serializer.save(user=self.request.user, report=report)