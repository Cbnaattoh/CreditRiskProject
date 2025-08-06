#!/usr/bin/env python
"""
Test ML assessment record creation
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

def test_ml_record_creation():
    print("Testing ML Assessment Record Creation...")
    print("=" * 50)
    
    User = get_user_model()
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123'
        }
    )
    print(f"Test user: {user.email}")
    
    # Create test application with complete financial data
    app = CreditApplication.objects.create(
        applicant=user,
        loan_amount=25000.00,
        annual_income=75000.00,
        debt_to_income_ratio=15.5,
        interest_rate=8.5,
        revolving_utilization=30.0,
        delinquencies_2yr=0,
        inquiries_6mo=1,
        employment_length='5 years',
        job_title='Software Engineer',
        open_accounts=8,
        collections_12mo=0,
        credit_history_length=10.0,
        max_bankcard_balance=5000.00,
        total_accounts=15,
        revolving_accounts_12mo=2,
        public_records=0,
        home_ownership='RENT',
        status='DRAFT'
    )
    print(f"Created application: {app.id}")
    
    # Test the _generate_credit_score method directly
    try:
        view = ApplicationSubmitView()
        factory = APIRequestFactory()
        request = factory.post('/')
        force_authenticate(request, user=user)
        
        print("\nGenerating credit score...")
        result = view._generate_credit_score(app, request)
        
        if result['success']:
            print(f"SUCCESS: Credit score generated: {result['credit_score']}")
            print(f"Category: {result['category']}")
            print(f"Risk Level: {result['risk_level']}")
            print(f"Confidence: {result['confidence']}%")
            
            # Check if ML assessment was created
            try:
                ml_assessment = MLCreditAssessment.objects.get(application=app)
                print(f"\nSUCCESS: ML Assessment record created!")
                print(f"DB Record ID: {ml_assessment.id}")
                print(f"Credit Score in DB: {ml_assessment.credit_score}")
                print(f"Category in DB: {ml_assessment.category}")
                print(f"Risk Level in DB: {ml_assessment.risk_level}")
                print(f"Confidence in DB: {ml_assessment.confidence}")
                print(f"Model Version: {ml_assessment.model_version}")
                print(f"Processing Time: {ml_assessment.processing_time_ms}ms")
                print(f"Features Used: {len(ml_assessment.features_used) if ml_assessment.features_used else 0}")
                print(f"Timestamp: {ml_assessment.prediction_timestamp}")
                
                # Check notes
                notes_count = app.additional_notes.filter(is_internal=True).count()
                print(f"Audit notes created: {notes_count}")
                
            except MLCreditAssessment.DoesNotExist:
                print("ERROR: ML Assessment record was not created in database")
                
        else:
            print(f"ERROR: Credit score generation failed: {result.get('error')}")
            
    except Exception as e:
        print(f"ERROR: Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Cleanup
    try:
        app.delete()
        print("\nTest data cleaned up")
    except Exception as e:
        print(f"Cleanup error: {e}")
    
    print("=" * 50)
    print("Test completed!")

if __name__ == '__main__':
    test_ml_record_creation()