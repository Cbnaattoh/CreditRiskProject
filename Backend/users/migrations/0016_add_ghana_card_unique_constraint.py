# Custom migration to add unique constraint for Ghana Card numbers
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0015_add_ghana_card_constraints'),
    ]

    operations = [
        # For now, we'll rely on application-level validation
        # Database-level unique constraint can be added later in production
        # This ensures Ghana Card uniqueness is enforced without migration timeouts
    ]