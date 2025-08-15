# Generated manually for ML notification types

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0003_alter_notification_related_content_type'),
    ]

    operations = [
        # This migration adds ML processing notification types to the existing Notification model
        # The NOTIFICATION_TYPES choices were already updated in models.py to include:
        # - ML_PROCESSING_STARTED
        # - ML_PROCESSING_COMPLETED  
        # - ML_PROCESSING_FAILED
        # - CREDIT_SCORE_GENERATED
        
        # No database schema changes needed as we're using CharField with choices
        # The new choices will be available immediately
    ]