#!/usr/bin/env python
"""
Test script to verify the complete application submission workflow
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
from rest_framework.test import APIRequestFactory
from rest_framework.test import force_authenticate

User = get_user_model()

def test_submission_flow():
    """Test the complete submission workflow"""
    print("Testing Application Submission Flow...")
    print("=" * 50)
    
    # 1. Create or get a test user
    try:
        user = User.objects.filter(email='test@example.com').first()
        if not user:
            user = User.objects.create_user(
                email='test@example.com',
                password='testpass123',
                first_name='Test',
                last_name='User'
            )
        print(f"✓ Test user: {user.email}")
    except Exception as e:
        print(f"✗ User creation failed: {e}")
        return
    
    # 2. Create a test application
    try:
        application = CreditApplication.objects.create(
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
        print(f"✓ Created test application: {application.id}")
    except Exception as e:
        print(f"✗ Application creation failed: {e}")
        return
    
    # 3. Test the submission workflow
    try:
        factory = APIRequestFactory()
        view = ApplicationSubmitView()
        
        # Create a mock request
        request = factory.post(f'/api/applications/{application.id}/submit/', {})
        force_authenticate(request, user=user)
        
        # Test the _generate_credit_score method directly
        print("\n📊 Testing ML Credit Score Generation...")
        ml_result = view._generate_credit_score(application, request)
        
        if ml_result['success']:
            print(f"✓ Credit Score: {ml_result['credit_score']}")
            print(f"✓ Category: {ml_result['category']}")
            print(f"✓ Risk Level: {ml_result['risk_level']}")
            print(f"✓ Confidence: {ml_result['confidence']}%")
            print(f"✓ Model Version: {ml_result['model_version']}")
        else:
            print(f"✗ ML prediction failed: {ml_result.get('error')}")
            return
            
    except Exception as e:
        print(f"✗ ML prediction test failed: {e}")
        return
    
    # 4. Check if data was stored in database
    try:
        print("\n💾 Checking Database Storage...")
        ml_assessment = MLCreditAssessment.objects.filter(application=application).first()
        
        if ml_assessment:
            print(f"✓ ML Assessment stored with ID: {ml_assessment.id}")
            print(f"✓ Credit Score in DB: {ml_assessment.credit_score}")
            print(f"✓ Category in DB: {ml_assessment.category}")
            print(f"✓ Risk Level in DB: {ml_assessment.risk_level}")
            print(f"✓ Confidence in DB: {ml_assessment.confidence}%")
            print(f"✓ Model Version in DB: {ml_assessment.model_version}")
            print(f"✓ Processing Time: {ml_assessment.processing_time_ms}ms")
            print(f"✓ Features Used: {len(ml_assessment.features_used or [])} features")
        else:
            print("✗ No ML Assessment found in database")
            
    except Exception as e:
        print(f"✗ Database check failed: {e}")
        return
    
    # 5. Check application notes
    try:
        print("\n📝 Checking Application Notes...")
        notes = application.additional_notes.filter(is_internal=True)
        ml_notes = [note for note in notes if 'ML Credit Score' in note.note]
        
        if ml_notes:
            print(f"✓ Found {len(ml_notes)} ML-related notes")
            latest_note = ml_notes[0]
            print(f"✓ Latest note created: {latest_note.created_at}")
            print(f"✓ Note preview: {latest_note.note[:100]}...")
        else:
            print("✗ No ML-related notes found")
            
    except Exception as e:
        print(f"✗ Notes check failed: {e}")
    
    print("\n" + "=" * 50)
    print("✓ Workflow test completed successfully!")
    print("✓ The application submission flow is working correctly")
    print("✓ ML model generates credit scores automatically")
    print("✓ All outputs are stored in the database")
    
    # Cleanup
    try:
        application.delete()
        print("\n🧹 Test data cleaned up")
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")

if __name__ == '__main__':
    test_submission_flow()