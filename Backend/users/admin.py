from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import User, UserProfile, LoginHistory, Permission, Role, UserRole, PermissionLog

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'
    extra = 0

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    model = User
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_staff', 'is_superuser')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'user_type', 'is_verified')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('email',)
    readonly_fields = ('last_login', 'date_joined', 'last_password_change')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'phone_number')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Security'), {'fields': ('mfa_enabled', 'mfa_secret', 'is_verified')}),
        (_('User Type'), {'fields': ('user_type',)}),
        (_('Important Dates'), {'fields': ('last_login', 'date_joined', 'last_password_change')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name', 'phone_number', 'user_type',
                'password1', 'password2',
                'is_active', 'is_staff', 'is_superuser'
            ),
        }),
    )

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'job_title', 'company', 'department', 'timezone', 'has_profile_picture')
    search_fields = ('user__email', 'company', 'job_title', 'department')

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'

    def has_profile_picture(self, obj):
        if obj.profile_picture:
            return format_html("<img src='{}' width='40' style='border-radius: 50%;'/>", obj.profile_picture.url)
        return "No"
    has_profile_picture.short_description = 'Profile Picture'

@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip_address', 'login_timestamp', 'session_duration', 'was_successful')
    list_filter = ('was_successful', 'login_timestamp')
    search_fields = ('user__email', 'ip_address', 'user_agent')
    ordering = ('-login_timestamp',)

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'codename', 'content_type', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['name', 'codename', 'description']
    readonly_fields = ['created_at']

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'permission_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['permissions']
    readonly_fields = ['created_at', 'updated_at']
     
    def permission_count(self, obj):
        return obj.permissions.count()
    permission_count.short_description = 'Permissions'

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'is_active', 'assigned_by', 'assigned_at', 'expires_at']
    list_filter = ['is_active', 'role', 'assigned_at']
    search_fields = ['user__email', 'role__name']
    readonly_fields = ['assigned_at']
    raw_id_fields = ['user', 'assigned_by']

@admin.register(PermissionLog)
class PermissionLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'permission_codename', 'action', 'resource_type', 'timestamp']
    list_filter = ['action', 'permission_codename', 'timestamp']
    search_fields = ['user__email', 'permission_codename', 'resource_type']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
     
    def has_add_permission(self, request):
        return False
     
    def has_change_permission(self, request, obj=None):
        return False