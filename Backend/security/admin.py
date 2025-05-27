# from django.contrib import admin
# from .models import SuspiciousActivity, BehavioralProfile

# @admin.register(SuspiciousActivity)
# class SuspiciousActivityAdmin(admin.ModelAdmin):
#     list_display = ('user', 'timestamp', 'activity_type', 'confidence_score')
#     list_filter = ('activity_type', 'timestamp')
#     search_fields = ('user__username', 'activity_type')
#     readonly_fields = ('timestamp',)
#     ordering = ('-timestamp',)

# @admin.register(BehavioralProfile)
# class BehavioralProfileAdmin(admin.ModelAdmin):
#     list_display = ('user', 'last_updated')
#     search_fields = ('user__username',)
#     readonly_fields = ('last_updated',)
