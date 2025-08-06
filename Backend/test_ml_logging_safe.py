#!/usr/bin/env python
"""
Test ML model logging during application submission (encoding safe)
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import CreditApplication
from users.models import User

def test_ml_logging():
    print("=== TESTING ML MODEL LOGGING ===")
    print("Creating a new application submission to trigger ML logging...")
    print("Watch the terminal for detailed ML model logs!")
    print("")
    
    # Get or create a test user
    try:
        test_user = User.objects.get(email='mltest@example.com')
    except User.DoesNotExist:
        test_user = User.objects.create_user(
            email='mltest@example.com',
            password='testpass123',
            first_name='ML',
            last_name='Test'
        )
    
    # Create application with detailed data
    app = CreditApplication.objects.create(
        applicant=test_user,
        status='DRAFT',  # Start as draft
        annual_income=85000.00,
        loan_amount=7500.00,
        employment_length='4 years',
        home_ownership='MORTGAGE',
        interest_rate=11.5,
        credit_history_length=4.5,
        debt_to_income_ratio=18.5,
        revolving_utilization=22.0,
        delinquencies_2yr=0,
        inquiries_6mo=1,
        open_accounts=8,
        collections_12mo=0,
        max_bankcard_balance=2500.00,
        total_accounts=12,
        revolving_accounts_12mo=3,
        public_records=0,
        job_title='Software Engineer'  # Set job title directly
    )
    
    print(f"SUCCESS: Created test application: {app.id}")
    print(f"Applicant: {test_user.email}")
    print(f"Loan Amount: ${app.loan_amount:,.2f}")
    print(f"Job Title: '{app.job_title}'")
    print(f"Status: {app.status}")
    print("")
    print("NOW CHANGING STATUS TO SUBMITTED TO TRIGGER ML MODEL...")
    print("=" * 80)
    
    # This will trigger the ML logging
    app.status = 'SUBMITTED'
    app.save()
    
    print("=" * 80)
    print("APPLICATION SUBMITTED! Check the logs above for detailed ML processing.")
    
    # Show results
    try:
        ml_assessment = app.ml_assessment
        print(f"\nML Assessment Results:")
        print(f"   Credit Score: {ml_assessment.credit_score}")
        print(f"   Category: {ml_assessment.category}")
        print(f"   Risk Level: {ml_assessment.risk_level}")
        print(f"   Confidence: {ml_assessment.confidence}%")
        print(f"   Processing Time: {ml_assessment.processing_time_ms}ms")
    except:
        print("\nNo ML assessment found")

if __name__ == '__main__':
    test_ml_logging()