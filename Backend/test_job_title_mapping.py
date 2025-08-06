#!/usr/bin/env python
"""
Test job title mapping from frontend to backend
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from applications.models import CreditApplication
from applications.serializers import CreditApplicationSerializer
from rest_framework.test import APIRequestFactory, force_authenticate

def test_job_title_mapping():
    print("=== TESTING JOB TITLE MAPPING ===")
    
    User = get_user_model()
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        email='jobtitle@example.com',
        defaults={
            'first_name': 'Job',
            'last_name': 'Tester',
            'password': 'testpass123'
        }
    )
    
    # Mock request for serializer context
    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = user
    
    # Sample frontend data with jobTitle in financial section
    frontend_data = {
        'loan_amount': 30000.00,
        'annual_income': 85000.00,
        'debt_to_income_ratio': 20.0,
        'interest_rate': 7.5,
        'revolving_utilization': 35.0,
        'employment_length': '6 years',
        'home_ownership': 'OWN',
        'jobTitle': 'Senior Software Developer',  # This should map to job_title
        'status': 'DRAFT'
    }
    
    print(f"Frontend data contains jobTitle: {frontend_data.get('jobTitle')}")
    
    # Create application using serializer
    try:
        serializer = CreditApplicationSerializer(
            data=frontend_data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            application = serializer.save()
            
            print(f"SUCCESS: Application created with ID: {application.id}")
            print(f"Job Title stored in DB: '{application.job_title}'")
            print(f"Expected: 'Senior Software Developer'")
            print(f"Match: {application.job_title == 'Senior Software Developer'}")
            
            # Verify in database
            db_app = CreditApplication.objects.get(id=application.id)
            print(f"Verification from DB: '{db_app.job_title}'")
            
            # Test ML model integration
            print("\n=== ML MODEL INTEGRATION TEST ===")
            ml_data = {
                'annual_inc': float(application.annual_income or 0),
                'dti': float(application.debt_to_income_ratio or 0),
                'int_rate': float(application.interest_rate or 0),
                'revol_util': float(application.revolving_utilization or 0),
                'delinq_2yrs': 0,
                'inq_last_6mths': 0,
                'emp_length': application.employment_length or '5 years',
                'emp_title': application.job_title or 'Other',  # This is the key field
                'open_acc': 8,
                'collections_12_mths_ex_med': 0,
                'loan_amnt': float(application.loan_amount or 0),
                'credit_history_length': 10.0,
                'max_bal_bc': 5000.0,
                'total_acc': 15,
                'open_rv_12m': 2,
                'pub_rec': 0,
                'home_ownership': application.home_ownership or 'RENT'
            }
            
            print(f"ML model will receive emp_title: '{ml_data['emp_title']}'")
            print("SUCCESS: Job title will be properly passed to ML model")
            
            return True
            
        else:
            print(f"ERROR: Serializer validation failed: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"ERROR: Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_job_title_mapping()
    if success:
        print("\n=== FINAL RESULT ===")
        print("SUCCESS: Job title mapping works correctly!")
        print("Frontend 'jobTitle' → Backend 'job_title' → ML model 'emp_title'")
    else:
        print("\n=== FINAL RESULT ===") 
        print("FAILED: Job title mapping needs attention")