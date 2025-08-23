"""
Enterprise notification monitoring and alerting system.
Provides real-time metrics and alerts for notification system health.
"""
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
import logging
from typing import Dict, List, Optional

from .models import Notification
from .retention_policy import EnterpriseRetentionPolicy

logger = logging.getLogger(__name__)

class NotificationMonitor:
    """
    Enterprise notification system monitoring.
    Tracks performance, usage patterns, and system health.
    """
    
    CACHE_KEY_PREFIX = 'notification_monitor'
    CACHE_TIMEOUT = 300  # 5 minutes
    
    @classmethod
    def get_system_health(cls) -> Dict:
        """Get comprehensive system health metrics"""
        cache_key = f"{cls.CACHE_KEY_PREFIX}:system_health"
        cached_health = cache.get(cache_key)
        
        if cached_health:
            return cached_health
            
        now = timezone.now()
        
        # Core metrics
        total_notifications = Notification.objects.count()
        unread_count = Notification.objects.filter(is_read=False).count()
        
        # Time-based metrics
        last_24h = Notification.objects.filter(
            created_at__gte=now - timedelta(hours=24)
        ).count()
        
        last_7days = Notification.objects.filter(
            created_at__gte=now - timedelta(days=7)  
        ).count()
        
        # Health indicators
        health_status = cls._calculate_health_status(total_notifications, last_24h)
        
        # Cleanup recommendations
        cleanup_candidates = cls._get_cleanup_candidates()
        
        health_data = {
            'timestamp': now.isoformat(),
            'status': health_status['status'],
            'health_score': health_status['score'],
            'metrics': {
                'total_notifications': total_notifications,
                'unread_notifications': unread_count,
                'notifications_24h': last_24h,
                'notifications_7d': last_7days,
                'read_percentage': (
                    ((total_notifications - unread_count) / total_notifications * 100) 
                    if total_notifications > 0 else 0
                )
            },
            'performance': {
                'avg_notifications_per_user': cls._get_avg_notifications_per_user(),
                'peak_users_count': cls._get_peak_notification_users(),
                'cleanup_candidates': cleanup_candidates['total'],
                'database_size_estimate': cls._estimate_database_size()
            },
            'recommendations': cls._get_health_recommendations(health_status, cleanup_candidates),
            'alerts': cls._get_active_alerts()
        }
        
        cache.set(cache_key, health_data, cls.CACHE_TIMEOUT)
        return health_data
    
    @classmethod
    def _calculate_health_status(cls, total_count: int, daily_count: int) -> Dict:
        """Calculate overall system health status"""
        thresholds = EnterpriseRetentionPolicy.PERFORMANCE_THRESHOLDS
        
        # Score based on total notifications
        if total_count < thresholds['monitoring_alert_threshold']:
            total_score = 100
        elif total_count < thresholds['max_total_notifications']:
            total_score = 70
        else:
            total_score = 30
            
        # Score based on daily volume
        if daily_count < 1000:
            daily_score = 100
        elif daily_count < 5000:
            daily_score = 80
        elif daily_count < 10000:
            daily_score = 60
        else:
            daily_score = 40
            
        # Overall health score
        overall_score = (total_score * 0.6) + (daily_score * 0.4)
        
        if overall_score >= 90:
            status = "healthy"
        elif overall_score >= 70:
            status = "warning" 
        elif overall_score >= 50:
            status = "degraded"
        else:
            status = "critical"
            
        return {
            'score': round(overall_score, 1),
            'status': status,
            'total_score': total_score,
            'daily_score': daily_score
        }
    
    @classmethod
    def _get_cleanup_candidates(cls) -> Dict:
        """Identify notifications that can be cleaned up"""
        from .retention_policy import should_cleanup_notification
        
        now = timezone.now()
        
        # Read notifications older than 30 days
        old_read = Notification.objects.filter(
            is_read=True,
            created_at__lt=now - timedelta(days=30)
        ).count()
        
        # Unread notifications older than 90 days
        old_unread = Notification.objects.filter(
            is_read=False,
            created_at__lt=now - timedelta(days=90)
        ).count()
        
        # Very old notifications (1 year+)
        very_old = Notification.objects.filter(
            created_at__lt=now - timedelta(days=365)
        ).count()
        
        return {
            'old_read': old_read,
            'old_unread': old_unread,
            'very_old': very_old,
            'total': old_read + old_unread + very_old
        }
    
    @classmethod 
    def _get_avg_notifications_per_user(cls) -> float:
        """Calculate average notifications per user"""
        user_counts = Notification.objects.values('recipient').annotate(
            count=Count('id')
        )
        
        if not user_counts:
            return 0.0
            
        total_users = len(user_counts)
        total_notifications = sum(uc['count'] for uc in user_counts)
        
        return round(total_notifications / total_users, 2)
    
    @classmethod
    def _get_peak_notification_users(cls) -> int:
        """Get count of users with high notification volumes"""
        threshold = EnterpriseRetentionPolicy.PERFORMANCE_THRESHOLDS['max_notifications_per_user']
        
        return Notification.objects.values('recipient').annotate(
            count=Count('id')
        ).filter(count__gt=threshold).count()
    
    @classmethod
    def _estimate_database_size(cls) -> Dict:
        """Estimate notification table database size"""
        from django.db import connection
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        pg_size_pretty(pg_total_relation_size('notifications_notification')) as table_size,
                        pg_size_pretty(pg_relation_size('notifications_notification')) as data_size,
                        pg_size_pretty(pg_total_relation_size('notifications_notification') - 
                                     pg_relation_size('notifications_notification')) as index_size
                """)
                result = cursor.fetchone()
                
                return {
                    'total_size': result[0] if result else 'Unknown',
                    'data_size': result[1] if result else 'Unknown', 
                    'index_size': result[2] if result else 'Unknown'
                }
        except Exception as e:
            logger.warning(f"Could not estimate database size: {e}")
            return {
                'total_size': 'Unknown',
                'data_size': 'Unknown',
                'index_size': 'Unknown'
            }
    
    @classmethod
    def _get_health_recommendations(cls, health_status: Dict, cleanup_candidates: Dict) -> List[str]:
        """Generate health improvement recommendations"""
        recommendations = []
        
        if health_status['status'] == 'critical':
            recommendations.append("🚨 URGENT: Run immediate notification cleanup - system is at critical capacity")
            
        if cleanup_candidates['total'] > 50000:
            recommendations.append("🧹 Run notification cleanup to remove old notifications")
            
        if health_status['daily_score'] < 70:
            recommendations.append("📊 High daily notification volume detected - review notification triggers")
            
        if cleanup_candidates['very_old'] > 10000:
            recommendations.append("📅 Many notifications older than 1 year found - consider compliance cleanup")
            
        if not recommendations:
            recommendations.append("✅ System is healthy - continue regular maintenance")
            
        return recommendations
    
    @classmethod
    def _get_active_alerts(cls) -> List[Dict]:
        """Get active system alerts"""
        alerts = []
        now = timezone.now()
        
        # Check for high notification volume
        recent_count = Notification.objects.filter(
            created_at__gte=now - timedelta(hours=1)
        ).count()
        
        if recent_count > 1000:
            alerts.append({
                'type': 'high_volume',
                'severity': 'warning',
                'message': f'High notification volume: {recent_count} notifications in last hour',
                'timestamp': now.isoformat()
            })
        
        # Check for stuck unread notifications
        old_unread = Notification.objects.filter(
            is_read=False,
            created_at__lt=now - timedelta(days=30)
        ).count()
        
        if old_unread > 1000:
            alerts.append({
                'type': 'stuck_unread',
                'severity': 'info', 
                'message': f'{old_unread} unread notifications older than 30 days',
                'timestamp': now.isoformat()
            })
        
        return alerts

    @classmethod
    def log_health_check(cls):
        """Log current system health for monitoring"""
        health = cls.get_system_health()
        
        logger.info(
            f"Notification System Health Check - "
            f"Status: {health['status']} "
            f"Score: {health['health_score']}/100 "
            f"Total: {health['metrics']['total_notifications']} "
            f"Cleanup Candidates: {health['performance']['cleanup_candidates']}"
        )
        
        # Log critical alerts
        for alert in health['alerts']:
            if alert['severity'] == 'warning':
                logger.warning(f"Notification Alert: {alert['message']}")
            elif alert['severity'] == 'critical':
                logger.error(f"Critical Notification Alert: {alert['message']}")
                
        return health