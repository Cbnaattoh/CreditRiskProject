#!/usr/bin/env python
"""
Test the improved job title handling logic
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import CreditApplication, Applicant, EmploymentInfo
from users.models import User

def test_job_title_scenarios():
    print("=== TESTING IMPROVED JOB TITLE HANDLING ===")
    
    # Get or create test user
    try:
        test_user = User.objects.get(email='jobtitletest@example.com')
    except User.DoesNotExist:
        test_user = User.objects.create_user(
            email='jobtitletest@example.com',
            password='testpass123',
            first_name='JobTitle',
            last_name='Test'
        )
    
    print(f"Using test user: {test_user.email}")
    print("")
    
    # Test Scenario 1: Application with job_title set directly (should work)
    print("=== SCENARIO 1: Job title set directly on application ===")
    app1 = CreditApplication.objects.create(
        applicant=test_user,
        status='DRAFT',
        annual_income=70000.00,
        loan_amount=5000.00,
        job_title='Data Scientist',  # Set directly
        employment_length='3 years',
        home_ownership='RENT',
        interest_rate=13.0,
        credit_history_length=3.0
    )
    
    print(f"Created application with direct job title: '{app1.job_title}'")
    print("Changing to SUBMITTED status...")
    app1.status = 'SUBMITTED'
    app1.save()
    
    print(f"After submission - Job title: '{app1.job_title}'")
    try:
        ml = app1.ml_assessment
        print(f"ML Assessment: Credit Score {ml.credit_score}, Used job: '{ml.ghana_job_category}'")
    except:
        print("No ML assessment created")
    print("")
    
    # Test Scenario 2: Application without job_title, but with employment info
    print("=== SCENARIO 2: No job title, but with employment info ===")
    app2 = CreditApplication.objects.create(
        applicant=test_user,
        status='DRAFT',
        annual_income=65000.00,
        loan_amount=4000.00,
        # Note: NO job_title set
        employment_length='2 years',
        home_ownership='OWN',
        interest_rate=12.0,
        credit_history_length=2.5
    )
    
    # Create applicant info with employment history
    applicant_info = Applicant.objects.create(
        application=app2,
        first_name='Test',
        last_name='Person',
        date_of_birth='1990-01-01',
        gender='M',
        marital_status='S',
        national_id='TEST-123456789-1',
        phone_number='+233244000001',
        email='test.person@example.com'
    )
    
    # Create employment info
    employment = EmploymentInfo.objects.create(
        applicant=applicant_info,
        employer_name='Tech Company',
        job_title='Backend Developer',  # This should be mapped to app2.job_title
        employment_type='FULL_TIME',
        start_date='2022-01-01',
        is_current=True,
        monthly_income=5400.00
    )
    
    print(f"Created application WITHOUT direct job title")
    print(f"Created employment info with job title: '{employment.job_title}'")
    print(f"Before submission - CreditApplication.job_title: '{app2.job_title}'")
    
    print("Changing to SUBMITTED status...")
    app2.status = 'SUBMITTED'
    app2.save()
    
    # Refresh from database to see if it was updated
    app2.refresh_from_db()
    print(f"After submission - CreditApplication.job_title: '{app2.job_title}'")
    
    try:
        ml = app2.ml_assessment
        print(f"ML Assessment: Credit Score {ml.credit_score}, Used job: '{ml.ghana_job_category}'")
    except:
        print("No ML assessment created")
    print("")
    
    # Test Scenario 3: Application without any job title info (should use 'Other')
    print("=== SCENARIO 3: No job title anywhere (should default to 'Other') ===")
    app3 = CreditApplication.objects.create(
        applicant=test_user,
        status='DRAFT',
        annual_income=60000.00,
        loan_amount=3000.00,
        # Note: NO job_title set, and no employment info will be created
        employment_length='1 year',
        home_ownership='RENT',
        interest_rate=14.0,
        credit_history_length=1.0
    )
    
    print(f"Created application with NO job title anywhere")
    print(f"Before submission - CreditApplication.job_title: '{app3.job_title}'")
    
    print("Changing to SUBMITTED status...")
    app3.status = 'SUBMITTED'
    app3.save()
    
    app3.refresh_from_db()
    print(f"After submission - CreditApplication.job_title: '{app3.job_title}'")
    
    try:
        ml = app3.ml_assessment
        print(f"ML Assessment: Credit Score {ml.credit_score}, Used job: '{ml.ghana_job_category}'")
    except:
        print("No ML assessment created")
    print("")
    
    # Summary
    print("=== SUMMARY ===")
    print(f"Scenario 1 (Direct job title): '{app1.job_title}'")
    print(f"Scenario 2 (From employment): '{app2.job_title}'")
    print(f"Scenario 3 (Default): '{app3.job_title}'")
    
    # Check ML assessments
    total_apps = CreditApplication.objects.count()
    total_ml = CreditApplication.objects.filter(ml_assessment__isnull=False).count()
    print(f"\nML Assessment Coverage: {total_ml}/{total_apps} applications have ML assessments")
    
    if total_ml == total_apps:
        print("SUCCESS: All applications have ML assessments!")
    else:
        print("ISSUE: Some applications missing ML assessments")

if __name__ == '__main__':
    test_job_title_scenarios()