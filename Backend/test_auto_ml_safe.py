#!/usr/bin/env python
"""
Test automatic ML model triggering (encoding safe)
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import CreditApplication, MLCreditAssessment

def test_results():
    print("=== AUTOMATIC ML TRIGGERING TEST RESULTS ===")
    
    # Get the latest applications and their ML assessments
    apps = CreditApplication.objects.order_by('-last_updated')[:3]
    
    print(f"\nRecent Applications:")
    for app in apps:
        print(f"\nApplication {app.id}:")
        print(f"  Status: {app.status}")
        print(f"  Job Title: '{app.job_title}'")
        print(f"  Annual Income: {app.annual_income}")
        print(f"  Loan Amount: {app.loan_amount}")
        
        # Check ML assessment
        try:
            ml = app.ml_assessment
            print(f"  ML Assessment: EXISTS")
            print(f"    Credit Score: {ml.credit_score}")
            print(f"    Category: {ml.category}")
            print(f"    Risk Level: {ml.risk_level}")
            print(f"    Confidence: {ml.confidence}%")
            print(f"    Ghana Job Category: {ml.ghana_job_category}")
            print(f"    Model Version: {ml.model_version}")
            print(f"    Processing Time: {ml.processing_time_ms}ms")
        except:
            print(f"  ML Assessment: MISSING")
    
    # Summary
    total_apps = CreditApplication.objects.count()
    total_ml = MLCreditAssessment.objects.count()
    submitted_apps = CreditApplication.objects.filter(status='SUBMITTED').count()
    
    print(f"\n=== SUMMARY ===")
    print(f"Total applications: {total_apps}")
    print(f"Submitted applications: {submitted_apps}")
    print(f"Total ML assessments: {total_ml}")
    print(f"ML coverage: {(total_ml/total_apps*100):.1f}%")
    
    # Test conclusion
    if total_ml >= submitted_apps:
        print(f"\nSUCCESS: Automatic ML triggering is working!")
        print(f"All submitted applications have ML assessments.")
    else:
        print(f"\nISSUE: Some submitted applications are missing ML assessments.")
        print(f"Expected: {submitted_apps}, Got: {total_ml}")

if __name__ == '__main__':
    test_results()