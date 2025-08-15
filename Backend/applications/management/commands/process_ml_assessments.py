"""
Django Management Command for ML Assessment Processing
Provides manual control and monitoring of ML pipeline
"""

from django.core.management.base import BaseCommand
from django.db.models import Q
from applications.models import CreditApplication, MLCreditAssessment
from applications.tasks import process_ml_credit_assessment, batch_process_ml_assessments
from applications.signals import trigger_manual_ml_assessment, trigger_batch_ml_assessment
import time


class Command(BaseCommand):
    help = 'Process ML credit assessments for applications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--application-id',
            type=str,
            help='Process specific application by ID'
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFO'],
            help='Process applications with specific status'
        )
        parser.add_argument(
            '--missing-only',
            action='store_true',
            help='Only process applications without ML assessments'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reprocessing even if assessment exists'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Batch size for processing (default: 10)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without actually processing'
        )
        parser.add_argument(
            '--monitor',
            action='store_true',
            help='Monitor current ML processing status'
        )

    def handle(self, *args, **options):
        if options['monitor']:
            self.monitor_processing_status()
            return

        if options['application_id']:
            self.process_single_application(options['application_id'], options['force'])
            return

        self.process_multiple_applications(options)

    def process_single_application(self, application_id, force=False):
        """Process a single application."""
        try:
            application = CreditApplication.objects.get(pk=application_id)
            self.stdout.write(f"Processing application: {application.reference_number}")
            
            # Check if assessment exists
            has_assessment = hasattr(application, 'ml_assessment')
            if has_assessment and not force:
                self.stdout.write(
                    self.style.WARNING(f"Assessment already exists for {application.reference_number}. Use --force to reprocess.")
                )
                return

            # Trigger processing
            task = trigger_manual_ml_assessment(application_id, force)
            
            self.stdout.write(
                self.style.SUCCESS(f"ML assessment task queued for {application.reference_number} (Task ID: {task.id})")
            )

            # Wait for result
            self.stdout.write("Waiting for processing to complete...")
            try:
                result = task.get(timeout=300)  # 5 minutes timeout
                
                if result['status'] == 'completed':
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ ML assessment completed for {result['reference_number']}:\n"
                            f"  Credit Score: {result['credit_score']}\n"
                            f"  Risk Level: {result['risk_level']}\n"
                            f"  Confidence: {result['confidence']:.1f}%\n"
                            f"  Processing Time: {result['processing_time_ms']}ms"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f"✗ Processing failed: {result.get('error', 'Unknown error')}")
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"✗ Processing timeout or error: {str(e)}")
                )
                
        except CreditApplication.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"Application {application_id} not found")
            )

    def process_multiple_applications(self, options):
        """Process multiple applications based on criteria."""
        # Build query
        query = Q()
        
        if options['status']:
            query &= Q(status=options['status'])
        
        if options['missing_only']:
            query &= Q(ml_assessment__isnull=True)
        
        # Get applications
        applications = CreditApplication.objects.filter(query)
        
        if not applications.exists():
            self.stdout.write(self.style.WARNING("No applications found matching criteria"))
            return
        
        total_count = applications.count()
        self.stdout.write(f"Found {total_count} applications matching criteria")
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING("DRY RUN - No actual processing will occur"))
            for app in applications[:10]:  # Show first 10
                has_assessment = hasattr(app, 'ml_assessment')
                status_indicator = "✓" if has_assessment else "○"
                self.stdout.write(f"  {status_indicator} {app.reference_number} ({app.status})")
            
            if total_count > 10:
                self.stdout.write(f"  ... and {total_count - 10} more")
            return

        # Process in batches
        batch_size = options['batch_size']
        processed = 0
        
        for i in range(0, total_count, batch_size):
            batch = applications[i:i + batch_size]
            application_ids = [str(app.id) for app in batch]
            
            self.stdout.write(f"Processing batch {i//batch_size + 1} ({len(application_ids)} applications)...")
            
            # Trigger batch processing
            task = trigger_batch_ml_assessment(application_ids, options['force'])
            
            try:
                result = task.get(timeout=600)  # 10 minutes timeout for batch
                
                self.stdout.write(
                    f"Batch {i//batch_size + 1} completed:\n"
                    f"  ✓ Completed: {result['completed']}\n"
                    f"  ○ Skipped: {result['skipped']}\n"
                    f"  ✗ Failed: {result['failed']}"
                )
                
                if result['errors']:
                    self.stdout.write(self.style.WARNING("Errors:"))
                    for error in result['errors'][:5]:  # Show first 5 errors
                        self.stdout.write(f"    {error}")
                
                processed += result['completed']
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Batch {i//batch_size + 1} failed: {str(e)}")
                )
            
            # Small delay between batches
            if i + batch_size < total_count:
                self.stdout.write("Waiting 5 seconds before next batch...")
                time.sleep(5)

        self.stdout.write(
            self.style.SUCCESS(f"Processing completed. {processed} assessments processed successfully.")
        )

    def monitor_processing_status(self):
        """Monitor current ML processing status."""
        self.stdout.write(self.style.SUCCESS("ML Processing Status Monitor"))
        self.stdout.write("=" * 50)
        
        # Overall statistics
        total_applications = CreditApplication.objects.count()
        with_assessments = CreditApplication.objects.filter(ml_assessment__isnull=False).count()
        without_assessments = total_applications - with_assessments
        
        self.stdout.write(f"Total Applications: {total_applications}")
        self.stdout.write(f"With ML Assessments: {with_assessments}")
        self.stdout.write(f"Missing Assessments: {without_assessments}")
        self.stdout.write()
        
        # Processing status breakdown
        if with_assessments > 0:
            status_counts = {}
            assessments = MLCreditAssessment.objects.all()
            
            for assessment in assessments:
                status = assessment.processing_status
                status_counts[status] = status_counts.get(status, 0) + 1
            
            self.stdout.write("Assessment Status Breakdown:")
            for status, count in status_counts.items():
                self.stdout.write(f"  {status}: {count}")
            self.stdout.write()
        
        # Recent failures
        failed_assessments = MLCreditAssessment.objects.filter(
            processing_status='FAILED'
        ).order_by('-last_updated')[:5]
        
        if failed_assessments.exists():
            self.stdout.write(self.style.ERROR("Recent Failures:"))
            for assessment in failed_assessments:
                self.stdout.write(
                    f"  {assessment.application.reference_number}: {assessment.processing_error[:100]}..."
                )
            self.stdout.write()
        
        # Applications needing processing
        needs_processing = CreditApplication.objects.filter(
            status='SUBMITTED',
            ml_assessment__isnull=True
        ).count()
        
        if needs_processing > 0:
            self.stdout.write(
                self.style.WARNING(f"Applications needing ML processing: {needs_processing}")
            )
            self.stdout.write("Use --status SUBMITTED --missing-only to process them")
        else:
            self.stdout.write(
                self.style.SUCCESS("✓ All submitted applications have ML assessments")
            )