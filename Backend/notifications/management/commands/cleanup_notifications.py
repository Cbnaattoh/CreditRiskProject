"""
Enterprise-grade notification cleanup management command.
Implements industry-standard retention policies for scalability.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
import logging

from notifications.models import Notification

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Clean up old notifications based on enterprise retention policies'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Number of notifications to process per batch (default: 1000)',
        )
        
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        now = timezone.now()
        
        # Enterprise retention policies
        policies = [
            {
                'name': 'Read notifications older than 30 days',
                'queryset': Notification.objects.filter(
                    is_read=True,
                    created_at__lt=now - timedelta(days=30)
                ),
                'priority': 1
            },
            {
                'name': 'Unread notifications older than 90 days', 
                'queryset': Notification.objects.filter(
                    is_read=False,
                    created_at__lt=now - timedelta(days=90)
                ),
                'priority': 2
            },
            {
                'name': 'All notifications older than 1 year (compliance)',
                'queryset': Notification.objects.filter(
                    created_at__lt=now - timedelta(days=365)
                ),
                'priority': 3
            }
        ]
        
        total_cleaned = 0
        
        for policy in policies:
            self.stdout.write(
                self.style.WARNING(f"\n📋 Processing: {policy['name']}")
            )
            
            queryset = policy['queryset']
            total_count = queryset.count()
            
            if total_count == 0:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ No notifications to clean for this policy")
                )
                continue
                
            self.stdout.write(f"📊 Found {total_count} notifications to process")
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(f"🔍 DRY RUN: Would delete {total_count} notifications")
                )
                continue
            
            # Process in batches for performance
            deleted_in_policy = 0
            
            while queryset.exists():
                with transaction.atomic():
                    # Get batch of IDs to avoid memory issues with large querysets
                    batch_ids = list(
                        queryset.values_list('id', flat=True)[:batch_size]
                    )
                    
                    if not batch_ids:
                        break
                        
                    # Delete the batch
                    deleted_count = Notification.objects.filter(
                        id__in=batch_ids
                    ).delete()[0]
                    
                    deleted_in_policy += deleted_count
                    
                    self.stdout.write(
                        f"🗑️  Deleted batch: {deleted_count} notifications "
                        f"(Total: {deleted_in_policy}/{total_count})"
                    )
            
            total_cleaned += deleted_in_policy
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Completed {policy['name']}: {deleted_in_policy} notifications cleaned"
                )
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"\n🔍 DRY RUN SUMMARY: Would clean {total_cleaned} total notifications"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n🎉 CLEANUP COMPLETE: {total_cleaned} total notifications cleaned"
                )
            )
            
            # Log the cleanup for audit trail
            logger.info(f"Notification cleanup completed. Cleaned {total_cleaned} notifications.")