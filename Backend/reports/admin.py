from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    Report, ReportTemplate, ReportSchedule,
    ReportAccess, ReportKPI, ReportComment
)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'report_type', 'status', 'created_by',
        'created_at', 'views_count', 'downloads_count'
    ]
    list_filter = ['report_type', 'status', 'created_at']
    search_fields = ['title', 'description', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'generated_at', 'views_count', 'downloads_count']
    filter_horizontal = ['shared_with']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'report_type', 'status')
        }),
        ('Access Control', {
            'fields': ('created_by', 'shared_with')
        }),
        ('Configuration', {
            'fields': ('date_from', 'date_to', 'filters', 'config'),
            'classes': ('collapse',)
        }),
        ('Generated Data', {
            'fields': ('data', 'file_path'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'generated_at', 'expires_at'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('views_count', 'downloads_count'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'created_by', 'is_public', 'created_at']
    list_filter = ['report_type', 'is_public', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')


@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'frequency', 'is_active', 'next_run', 'last_run', 'created_by']
    list_filter = ['frequency', 'is_active', 'created_at']
    search_fields = ['name', 'template__name']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['recipients']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('template', 'created_by')


class ReportAccessInline(admin.TabularInline):
    model = ReportAccess
    extra = 0
    readonly_fields = ['user', 'action', 'accessed_at', 'ip_address', 'export_format']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


class ReportCommentInline(admin.TabularInline):
    model = ReportComment
    extra = 0
    readonly_fields = ['user', 'created_at', 'updated_at']


@admin.register(ReportAccess)
class ReportAccessAdmin(admin.ModelAdmin):
    list_display = ['report', 'user', 'action', 'accessed_at', 'ip_address']
    list_filter = ['action', 'accessed_at']
    search_fields = ['report__title', 'user__email']
    readonly_fields = ['accessed_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('report', 'user')


@admin.register(ReportKPI)
class ReportKPIAdmin(admin.ModelAdmin):
    list_display = ['name', 'metric_type', 'data_source', 'is_active', 'created_by']
    list_filter = ['metric_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'metric_type', 'is_active')
        }),
        ('Data Configuration', {
            'fields': ('data_source', 'calculation_method'),
        }),
        ('Display Configuration', {
            'fields': ('display_format', 'color_scheme', 'chart_type'),
            'classes': ('collapse',)
        }),
        ('Access Control', {
            'fields': ('required_permissions', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReportComment)
class ReportCommentAdmin(admin.ModelAdmin):
    list_display = ['report', 'user', 'comment_preview', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['report__title', 'user__email', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('report', 'user')


# Enhance Report admin with inlines
ReportAdmin.inlines = [ReportAccessInline, ReportCommentInline]