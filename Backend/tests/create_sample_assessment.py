#!/usr/bin/env python
"""
Create a sample ML assessment to demonstrate the workflow
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from applications.models import CreditApplication, MLCreditAssessment
from applications.views import ApplicationSubmitView
from rest_framework.test import APIRequestFactory, force_authenticate

def create_sample():
    print("Creating Sample ML Assessment...")
    print("=" * 40)
    
    User = get_user_model()
    
    # Get or create demo user
    user, created = User.objects.get_or_create(
        email='demo@example.com',
        defaults={
            'first_name': 'Demo',
            'last_name': 'User',
            'password': 'demopass123'
        }
    )
    
    # Create demo application
    app = CreditApplication.objects.create(
        applicant=user,
        loan_amount=50000.00,
        annual_income=90000.00,
        debt_to_income_ratio=18.5,
        interest_rate=7.2,
        revolving_utilization=25.0,
        delinquencies_2yr=0,
        inquiries_6mo=2,
        employment_length='8 years',
        job_title='Senior Developer',
        open_accounts=12,
        collections_12mo=0,
        credit_history_length=15.0,
        max_bankcard_balance=8000.00,
        total_accounts=20,
        revolving_accounts_12mo=3,
        public_records=0,
        home_ownership='OWN',
        status='DRAFT'
    )
    
    print(f"Demo application created: {app.id}")
    
    # Generate ML assessment
    try:
        view = ApplicationSubmitView()
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user  # Set user properly
        
        result = view._generate_credit_score(app, request)
        
        if result['success']:
            print(f"SUCCESS: ML Assessment Created!")
            print(f"Credit Score: {result['credit_score']}")
            print(f"Category: {result['category']}")
            print(f"Risk Level: {result['risk_level']}")
            print(f"Confidence: {result['confidence']}%")
            
            # Verify in database
            assessment = MLCreditAssessment.objects.get(application=app)
            print(f"\nDatabase Record:")
            print(f"ID: {assessment.id}")
            print(f"Application ID: {assessment.application.id}")
            print(f"User: {assessment.application.applicant.email}")
            print(f"Timestamp: {assessment.prediction_timestamp}")
            
            print(f"\nDemo data preserved for verification.")
            print(f"Check table: ml_credit_assessments")
            print(f"Application will remain as DRAFT for demo purposes.")
            
        else:
            print(f"ERROR: {result.get('error')}")
            app.delete()
    
    except Exception as e:
        print(f"ERROR: {e}")
        app.delete()

if __name__ == '__main__':
    create_sample()