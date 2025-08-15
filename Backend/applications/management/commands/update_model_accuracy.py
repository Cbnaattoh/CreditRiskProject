from django.core.management.base import BaseCommand
from applications.models import MLCreditAssessment

class Command(BaseCommand):
    help = 'Update model_accuracy for existing ML assessments'

    def handle(self, *args, **options):
        # Update all ML assessments without model_accuracy
        assessments_to_update = MLCreditAssessment.objects.filter(
            model_accuracy__isnull=True
        )
        
        count = assessments_to_update.count()
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No ML assessments need model_accuracy update')
            )
            return
        
        # Set default accuracy of 98.4 for existing assessments
        assessments_to_update.update(model_accuracy=98.4)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated model_accuracy for {count} ML assessments'
            )
        )