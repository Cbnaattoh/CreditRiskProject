"""
Enterprise Notification Retention Policy Configuration
Implements industry-standard data retention for compliance and performance.
"""
from datetime import timedelta
from typing import Dict, List, NamedTuple
from enum import Enum

class NotificationPriority(Enum):
    """Notification priority levels for retention policies"""
    HIGH = "high"           # Critical system alerts, security notifications
    MEDIUM = "medium"       # Application status changes, ML processing
    LOW = "low"            # General information, marketing
    SYSTEM = "system"      # System-generated, automated notifications

class RetentionRule(NamedTuple):
    """Individual retention rule configuration"""
    name: str
    description: str  
    read_retention_days: int
    unread_retention_days: int
    applies_to_types: List[str]
    priority: NotificationPriority

class EnterpriseRetentionPolicy:
    """
    Enterprise-grade notification retention policy.
    
    Industry Standards Applied:
    - GDPR compliance (data minimization)
    - SOX compliance (audit trail retention)
    - Performance optimization (database size management)
    - User experience (relevant notifications only)
    """
    
    # Base retention rules by notification type
    RETENTION_RULES: List[RetentionRule] = [
        RetentionRule(
            name="Critical Security Notifications",
            description="Security alerts, fraud detection, compliance violations",
            read_retention_days=365,      # 1 year for audit compliance
            unread_retention_days=365,    # Critical - never auto-delete unread
            applies_to_types=[
                'SYSTEM_ALERT',
                'SECURITY_ALERT', 
                'FRAUD_DETECTION'
            ],
            priority=NotificationPriority.HIGH
        ),
        
        RetentionRule(
            name="Business Process Notifications", 
            description="Application status, decisions, ML processing results",
            read_retention_days=90,       # 3 months business retention
            unread_retention_days=180,    # 6 months for unread important items
            applies_to_types=[
                'STATUS_CHANGE',
                'DECISION_MADE', 
                'ML_PROCESSING_COMPLETED',
                'ML_PROCESSING_FAILED',
                'CREDIT_SCORE_GENERATED'
            ],
            priority=NotificationPriority.MEDIUM
        ),
        
        RetentionRule(
            name="Informational Notifications",
            description="General updates, document uploads, routine information",
            read_retention_days=30,       # 1 month for read informational
            unread_retention_days=90,     # 3 months for unread
            applies_to_types=[
                'APPLICATION_SUBMITTED',
                'DOCUMENT_UPLOADED',
                'ML_PROCESSING_STARTED'
            ],
            priority=NotificationPriority.LOW
        ),
        
        RetentionRule(
            name="System Maintenance Notifications",
            description="System maintenance, automated processes, low-priority alerts",
            read_retention_days=7,        # 1 week for system notifications
            unread_retention_days=30,     # 1 month for unread system messages
            applies_to_types=[
                'SYSTEM_MAINTENANCE',
                'AUTOMATED_PROCESS',
                'INFORMATION_UPDATE'
            ],
            priority=NotificationPriority.SYSTEM
        )
    ]
    
    # Global fallback rules
    DEFAULT_RULES = RetentionRule(
        name="Default Retention Policy",
        description="Applied to notification types not specifically configured",
        read_retention_days=30,
        unread_retention_days=90, 
        applies_to_types=[],
        priority=NotificationPriority.LOW
    )
    
    # Performance thresholds
    PERFORMANCE_THRESHOLDS = {
        'max_notifications_per_user': 1000,    # Archive user if exceeded
        'max_total_notifications': 500000,     # Trigger aggressive cleanup
        'cleanup_batch_size': 5000,           # Batch size for cleanup operations
        'monitoring_alert_threshold': 100000   # Alert admins at this count
    }
    
    # User-specific overrides (VIP users, admin accounts)
    USER_OVERRIDES = {
        'admin_users': {
            'read_retention_multiplier': 2.0,    # Double retention for admin users
            'unread_retention_multiplier': 3.0   # Triple retention for unread admin notifications
        },
        'vip_users': {
            'read_retention_multiplier': 1.5,    # 50% longer retention for VIP users
            'unread_retention_multiplier': 2.0   # Double retention for unread VIP notifications  
        }
    }
    
    @classmethod
    def get_retention_rule(cls, notification_type: str) -> RetentionRule:
        """Get the appropriate retention rule for a notification type"""
        for rule in cls.RETENTION_RULES:
            if notification_type in rule.applies_to_types:
                return rule
        return cls.DEFAULT_RULES
    
    @classmethod
    def get_user_retention_multiplier(cls, user) -> Dict[str, float]:
        """Get retention multipliers based on user type"""
        if hasattr(user, 'is_staff') and user.is_staff:
            return cls.USER_OVERRIDES['admin_users']
        elif hasattr(user, 'is_vip') and getattr(user, 'is_vip', False):
            return cls.USER_OVERRIDES['vip_users'] 
        else:
            return {'read_retention_multiplier': 1.0, 'unread_retention_multiplier': 1.0}
    
    @classmethod
    def calculate_retention_days(cls, notification_type: str, is_read: bool, user=None) -> int:
        """Calculate final retention days for a specific notification"""
        rule = cls.get_retention_rule(notification_type)
        base_days = rule.read_retention_days if is_read else rule.unread_retention_days
        
        if user:
            multipliers = cls.get_user_retention_multiplier(user)
            multiplier_key = 'read_retention_multiplier' if is_read else 'unread_retention_multiplier'
            base_days = int(base_days * multipliers[multiplier_key])
        
        return base_days
    
    @classmethod
    def get_cleanup_summary(cls) -> Dict:
        """Get a summary of current retention policies for monitoring"""
        return {
            'total_rules': len(cls.RETENTION_RULES),
            'rule_summary': [
                {
                    'name': rule.name,
                    'read_days': rule.read_retention_days,
                    'unread_days': rule.unread_retention_days,
                    'notification_types': rule.applies_to_types,
                    'priority': rule.priority.value
                }
                for rule in cls.RETENTION_RULES
            ],
            'performance_thresholds': cls.PERFORMANCE_THRESHOLDS,
            'default_policy': {
                'read_days': cls.DEFAULT_RULES.read_retention_days,
                'unread_days': cls.DEFAULT_RULES.unread_retention_days
            }
        }

# Quick access functions for use in tasks and management commands
def get_retention_days(notification_type: str, is_read: bool, user=None) -> int:
    """Convenience function to get retention days"""
    return EnterpriseRetentionPolicy.calculate_retention_days(notification_type, is_read, user)

def should_cleanup_notification(notification) -> bool:
    """Check if a notification should be cleaned up based on policy"""
    from django.utils import timezone
    
    retention_days = get_retention_days(
        notification.notification_type,
        notification.is_read,
        notification.recipient
    )
    
    cutoff_date = timezone.now() - timedelta(days=retention_days)
    return notification.created_at < cutoff_date