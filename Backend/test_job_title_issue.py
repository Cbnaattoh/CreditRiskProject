#!/usr/bin/env python
"""
Test job title storage and mapping in the application system
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import CreditApplication, Applicant, EmploymentInfo
from users.models import User
from django.db import connection

def test_job_title_storage():
    print("=== TESTING JOB TITLE STORAGE ===")
    
    # Check the database schema for job title fields
    print("\n1. Checking database schema for job_title columns:")
    with connection.cursor() as cursor:
        # Check CreditApplication table
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'applications_creditapplication' 
            AND column_name LIKE '%job%' OR column_name LIKE '%title%' OR column_name LIKE '%employment%';
        """)
        credit_app_columns = cursor.fetchall()
        print("  applications_creditapplication:")
        for col in credit_app_columns:
            print(f"    - {col[0]} ({col[1]}) - Nullable: {col[2]}")
        
        # Check EmploymentInfo table  
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'applications_employmentinfo' 
            AND column_name LIKE '%job%' OR column_name LIKE '%title%' OR column_name LIKE '%employment%';
        """)
        employment_columns = cursor.fetchall()
        print("  applications_employmentinfo:")
        for col in employment_columns:
            print(f"    - {col[0]} ({col[1]}) - Nullable: {col[2]}")
    
    print("\n2. Examining model field definitions:")
    
    # Check CreditApplication model fields
    credit_app_fields = CreditApplication._meta.get_fields()
    job_related_fields = [f for f in credit_app_fields if 'job' in f.name.lower() or 'employment' in f.name.lower() or 'title' in f.name.lower()]
    print("  CreditApplication job-related fields:")
    for field in job_related_fields:
        print(f"    - {field.name}: {type(field).__name__}")
    
    # Check EmploymentInfo model fields  
    employment_fields = EmploymentInfo._meta.get_fields()
    job_related_fields_emp = [f for f in employment_fields if 'job' in f.name.lower() or 'employment' in f.name.lower() or 'title' in f.name.lower()]
    print("  EmploymentInfo job-related fields:")
    for field in job_related_fields_emp:
        print(f"    - {field.name}: {type(field).__name__}")
    
    print("\n3. Testing data creation with different job titles:")
    
    # Create a test user (if needed)
    try:
        test_user = User.objects.get(email='test@example.com')
    except User.DoesNotExist:
        test_user = User.objects.create_user(
            email='test@example.com', 
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    # Test Case 1: Software Developer in CreditApplication
    print("\n  Test Case 1: Creating application with 'Software Developer' job_title")
    app1 = CreditApplication.objects.create(
        applicant=test_user,
        job_title='Software Developer',
        loan_amount=50000.00
    )
    print(f"    Created application {app1.id} with job_title: '{app1.job_title}'")
    
    # Test Case 2: Teacher in CreditApplication  
    print("\n  Test Case 2: Creating application with 'Teacher' job_title")
    app2 = CreditApplication.objects.create(
        applicant=test_user,
        job_title='Teacher',
        loan_amount=30000.00
    )
    print(f"    Created application {app2.id} with job_title: '{app2.job_title}'")
    
    # Test Case 3: Create Applicant with EmploymentInfo
    print("\n  Test Case 3: Creating application with Applicant and EmploymentInfo")
    app3 = CreditApplication.objects.create(
        applicant=test_user,
        job_title='Doctor',  # This goes in CreditApplication
        loan_amount=75000.00
    )
    
    # Create applicant info
    applicant_info = Applicant.objects.create(
        application=app3,
        first_name='John',
        last_name='Doe',
        date_of_birth='1990-01-01',
        gender='M',
        marital_status='S',
        national_id='12345678',
        phone_number='+1234567890',
        email='john.doe@example.com'
    )
    
    # Create employment info with different job title
    employment = EmploymentInfo.objects.create(
        applicant=applicant_info,
        employer_name='General Hospital',
        job_title='Emergency Physician',  # This goes in EmploymentInfo
        employment_type='FULL_TIME',
        start_date='2020-01-01',
        is_current=True,
        monthly_income=15000.00
    )
    
    print(f"    Created application {app3.id}")
    print(f"    CreditApplication.job_title: '{app3.job_title}'")
    print(f"    EmploymentInfo.job_title: '{employment.job_title}'")
    
    print("\n4. Querying all applications and their job titles:")
    all_apps = CreditApplication.objects.all()
    for app in all_apps:
        print(f"  Application {app.id}:")
        print(f"    CreditApplication.job_title: '{app.job_title}'")
        
        # Check if there's applicant info
        try:
            applicant = app.applicant_info
            employment_records = applicant.employment_history.all()
            for emp in employment_records:
                print(f"    EmploymentInfo.job_title: '{emp.job_title}'")
        except:
            print(f"    No applicant info or employment records")
    
    print("\n=== JOB TITLE INVESTIGATION COMPLETE ===")
    print("\nFindings:")
    print("1. CreditApplication.job_title field exists and stores job titles")
    print("2. EmploymentInfo.job_title field exists for detailed employment records")  
    print("3. Both fields can store different job titles for the same application")
    print("4. The issue may be in the frontend form or data mapping logic")

if __name__ == '__main__':
    test_job_title_storage()