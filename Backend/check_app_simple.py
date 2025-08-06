#!/usr/bin/env python
"""
Check recent application details and ML assessment (encoding-safe)
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import CreditApplication, MLCreditAssessment

def check_application():
    print("=== CHECKING RECENT APPLICATION ===")
    
    # Get the most recent application
    try:
        app = CreditApplication.objects.order_by('-last_updated').first()
        if not app:
            print("No applications found")
            return
        
        print(f"\n=== APPLICATION DETAILS ===")
        print(f"ID: {app.id}")
        print(f"Status: {app.status}")
        print(f"Reference Number: {app.reference_number}")
        print(f"Job Title: '{app.job_title}'")
        print(f"Annual Income: {app.annual_income}")
        print(f"Loan Amount: {app.loan_amount}")
        print(f"Employment Length: {app.employment_length}")
        print(f"Home Ownership: {app.home_ownership}")
        print(f"Interest Rate: {app.interest_rate}")
        print(f"Credit History Length: {app.credit_history_length}")
        print(f"Last Updated: {app.last_updated}")
        print(f"Submission Date: {app.submission_date}")
        
        # Check if there's an ML assessment
        print(f"\n=== ML ASSESSMENT CHECK ===")
        try:
            ml = app.ml_assessment
            print(f"Credit Score: {ml.credit_score}")
            print(f"Category: {ml.category}")
            print(f"Risk Level: {ml.risk_level}")
            print(f"Confidence: {ml.confidence}%")
            print(f"Ghana Job Category: {ml.ghana_job_category}")
            print(f"Ghana Employment Score: {ml.ghana_employment_score}")
            print(f"Model Version: {ml.model_version}")
            print(f"Prediction Timestamp: {ml.prediction_timestamp}")
        except Exception:
            print("NO ML Assessment found!")
            print("ML model did not generate scores for this application")
        
        # Check if there's applicant info
        print(f"\n=== APPLICANT INFO CHECK ===")
        try:
            applicant = app.applicant_info
            print(f"Applicant Name: {applicant.full_name()}")
            print(f"Employment History: {applicant.employment_history.count()} records")
            
            # Check employment info job titles
            for emp in applicant.employment_history.all():
                print(f"  - Employment Job Title: '{emp.job_title}'")
                print(f"  - Employer: {emp.employer_name}")
        except Exception:
            print("NO applicant info found!")
        
        print(f"\n=== ISSUE SUMMARY ===")
        print("1. Job Title Issue:")
        print(f"   - CreditApplication.job_title = '{app.job_title}' (EMPTY)")
        
        print("2. ML Assessment Issue:")
        ml_count = MLCreditAssessment.objects.filter(application=app).count()
        print(f"   - ML Assessment records for this app: {ml_count}")
        
        print("3. Data that WAS saved:")
        saved_fields = []
        for field in ['annual_income', 'loan_amount', 'employment_length', 'home_ownership', 'interest_rate', 'credit_history_length']:
            value = getattr(app, field)
            if value:
                saved_fields.append(f"{field}={value}")
        print(f"   - {', '.join(saved_fields)}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_application()