#!/usr/bin/env python
"""
Test automatic ML model triggering on application submission
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import CreditApplication, Applicant, EmploymentInfo, MLCreditAssessment
from users.models import User

def test_auto_ml_trigger():
    print("=== TESTING AUTOMATIC ML MODEL TRIGGERING ===")
    
    # Get or create a test user
    try:
        test_user = User.objects.get(email='test@example.com')
    except User.DoesNotExist:
        test_user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        print(f"Created test user: {test_user.email}")
    
    # Test Case 1: Create application with DRAFT status first
    print("\n1. Creating application with DRAFT status...")
    app = CreditApplication.objects.create(
        applicant=test_user,
        status='DRAFT',  # Start as draft
        annual_income=75000.00,
        loan_amount=5000.00,
        employment_length='3 years',
        home_ownership='RENT',
        interest_rate=14.5,
        credit_history_length=3.0,
        job_title='Teacher'  # Set job title directly
    )
    print(f"   Created application {app.id} with status: {app.status}")
    
    # Check if ML assessment exists (should not)
    ml_count_before = MLCreditAssessment.objects.filter(application=app).count()
    print(f"   ML assessments before submission: {ml_count_before}")
    
    # Test Case 2: Change status to SUBMITTED (this should trigger ML generation)
    print("\n2. Changing status to SUBMITTED to trigger ML generation...")
    app.status = 'SUBMITTED'
    app.save()
    print(f"   Changed status to: {app.status}")
    
    # Check if ML assessment was created automatically
    ml_count_after = MLCreditAssessment.objects.filter(application=app).count()
    print(f"   ML assessments after submission: {ml_count_after}")
    
    if ml_count_after > ml_count_before:
        print("   ✅ SUCCESS: ML assessment was automatically generated!")
        
        # Show the generated ML assessment
        ml = MLCreditAssessment.objects.get(application=app)
        print(f"\n   Generated ML Assessment:")
        print(f"     Credit Score: {ml.credit_score}")
        print(f"     Category: {ml.category}")
        print(f"     Risk Level: {ml.risk_level}")
        print(f"     Confidence: {ml.confidence}%")
        print(f"     Ghana Job Category: {ml.ghana_job_category}")
        print(f"     Model Version: {ml.model_version}")
        print(f"     Processing Time: {ml.processing_time_ms}ms")
        
    else:
        print("   ❌ FAILED: ML assessment was NOT generated automatically")
        
        # Debug information
        print("\n   Debug Information:")
        print(f"     Application status: {app.status}")
        print(f"     Job title: '{app.job_title}'")
        print(f"     Annual income: {app.annual_income}")
        print(f"     Loan amount: {app.loan_amount}")
    
    # Test Case 3: Test job title mapping fix
    print("\n3. Testing job title mapping fix...")
    
    # Create another application without direct job_title but with employment info
    app2 = CreditApplication.objects.create(
        applicant=test_user,
        status='DRAFT',
        annual_income=60000.00,
        loan_amount=3000.00,
        employment_length='2 years',
        home_ownership='OWN',
        interest_rate=13.0,
        credit_history_length=2.0
        # Note: no job_title set directly
    )
    
    # Create applicant info with employment history
    applicant_info = Applicant.objects.create(
        application=app2,
        first_name='Jane',
        last_name='Doe',
        date_of_birth='1985-01-01',
        gender='F',
        marital_status='S',
        national_id='GHA-123456789-1',
        phone_number='+233244123456',
        email='jane.doe@example.com'
    )
    
    # Create employment info with job title
    employment = EmploymentInfo.objects.create(
        applicant=applicant_info,
        employer_name='ABC Company',
        job_title='Software Engineer',  # This should be copied to app2.job_title
        employment_type='FULL_TIME',
        start_date='2022-01-01',
        is_current=True,
        monthly_income=5000.00
    )
    
    print(f"   Created application {app2.id}")
    print(f"   Initial CreditApplication.job_title: '{app2.job_title}'")
    print(f"   EmploymentInfo.job_title: '{employment.job_title}'")
    
    # Change status to SUBMITTED (should trigger both job title fix AND ML generation)
    app2.status = 'SUBMITTED'
    app2.save()
    
    # Refresh from database
    app2.refresh_from_db()
    print(f"   After submission:")
    print(f"     CreditApplication.job_title: '{app2.job_title}'")
    
    # Check ML assessment
    ml_exists = MLCreditAssessment.objects.filter(application=app2).exists()
    if ml_exists:
        ml2 = MLCreditAssessment.objects.get(application=app2)
        print(f"     ML Assessment generated: YES")
        print(f"     Credit Score: {ml2.credit_score}")
        print(f"     Used job title: '{ml2.ghana_job_category}'")
    else:
        print(f"     ML Assessment generated: NO")
    
    # Summary
    print(f"\n=== TEST SUMMARY ===")
    total_apps = CreditApplication.objects.count()
    total_ml = MLCreditAssessment.objects.count()
    print(f"Total applications: {total_apps}")
    print(f"Total ML assessments: {total_ml}")
    print(f"ML coverage: {(total_ml/total_apps*100):.1f}%")
    
    print(f"\n✅ Automatic ML triggering is now {'WORKING' if total_ml >= 2 else 'NOT WORKING'}")

if __name__ == '__main__':
    test_auto_ml_trigger()