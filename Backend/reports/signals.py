from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.cache import cache
from .models import Report, ReportAccess


@receiver(post_save, sender=Report)
def invalidate_report_cache(sender, instance, **kwargs):
    """
    Invalidate related caches when a report is updated
    """
    # Invalidate user's report list cache
    cache.delete(f"user_reports_{instance.created_by.id}")
    
    # Invalidate shared users' caches
    for user in instance.shared_with.all():
        cache.delete(f"user_reports_{user.id}")
    
    # Invalidate analytics cache
    cache.delete("report_analytics")


@receiver(post_save, sender=ReportAccess)
def update_report_stats(sender, instance, created, **kwargs):
    """
    Update report statistics when accessed
    """
    if created:
        # Invalidate report cache to refresh stats
        cache.delete(f"report_{instance.report.id}")
        cache.delete("report_analytics")