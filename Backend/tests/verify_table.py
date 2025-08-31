import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import MLCreditAssessment

print("=== ML CREDIT ASSESSMENTS TABLE VERIFICATION ===")
print(f"Table name: {MLCreditAssessment._meta.db_table}")
print(f"Total records: {MLCreditAssessment.objects.count()}")

for assessment in MLCreditAssessment.objects.all():
    print(f"\nRecord {assessment.id}:")
    print(f"  Application: {assessment.application.id}")  
    print(f"  User: {assessment.application.applicant.email}")
    print(f"  Credit Score: {assessment.credit_score}")
    print(f"  Category: {assessment.category}")
    print(f"  Risk Level: {assessment.risk_level}")
    print(f"  Confidence: {assessment.confidence}%")
    print(f"  Created: {assessment.prediction_timestamp}")

print("\n=== DATABASE CONNECTION INFO ===")
from django.conf import settings
db = settings.DATABASES['default']
print(f"Database: {db['NAME']}")
print(f"Host: {db['HOST']}")
print(f"Port: {db['PORT']}")
print(f"User: {db['USER']}")