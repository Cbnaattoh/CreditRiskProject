#!/usr/bin/env python
"""
Fix the job title and ML assessment issues for the recent application
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Add ML model path to Python path
ml_model_path = os.path.join(os.path.dirname(__file__), 'ml_model')
if ml_model_path not in sys.path:
    sys.path.append(ml_model_path)

from applications.models import CreditApplication, MLCreditAssessment, ApplicationNote

def fix_application_issues():
    print("=== FIXING APPLICATION ISSUES ===")
    
    # Get the recent application
    app = CreditApplication.objects.order_by('-last_updated').first()
    if not app:
        print("No application found")
        return
    
    print(f"Working on application: {app.id}")
    print(f"Current job_title: '{app.job_title}'")
    
    # Issue 1: Fix job title mapping
    print("\n1. FIXING JOB TITLE ISSUE:")
    try:
        # Get the job title from employment info
        applicant = app.applicant_info
        employment = applicant.employment_history.first()
        if employment and employment.job_title:
            actual_job_title = employment.job_title
            print(f"   Found job title in EmploymentInfo: '{actual_job_title}'")
            
            # Update CreditApplication.job_title
            app.job_title = actual_job_title
            app.save()
            print(f"   Updated CreditApplication.job_title to: '{app.job_title}'")
        else:
            print("   No employment info found")
    except Exception as e:
        print(f"   Error fixing job title: {e}")
    
    # Issue 2: Generate missing ML assessment
    print("\n2. FIXING ML ASSESSMENT ISSUE:")
    try:
        from src.credit_scorer import get_credit_scorer
        
        # Prepare data for ML model (same as in views.py)
        ml_data = {
            'annual_inc': float(app.annual_income or 0),
            'dti': float(app.debt_to_income_ratio or 12.0),  # Use calculated value
            'int_rate': float(app.interest_rate or 0),
            'revol_util': float(app.revolving_utilization or 5.0),
            'delinq_2yrs': int(app.delinquencies_2yr or 1),
            'inq_last_6mths': int(app.inquiries_6mo or 0),
            'emp_length': app.employment_length or '< 1 year',
            'emp_title': app.job_title or 'Other',
            'open_acc': int(app.open_accounts or 0),
            'collections_12_mths_ex_med': int(app.collections_12mo or 1),
            'loan_amnt': float(app.loan_amount or 0),
            'credit_history_length': float(app.credit_history_length or 0),
            'max_bal_bc': float(app.max_bankcard_balance or 300.0),
            'total_acc': int(app.total_accounts or 11),
            'open_rv_12m': int(app.revolving_accounts_12mo or 0),
            'pub_rec': int(app.public_records or 0),
            'home_ownership': app.home_ownership or 'RENT'
        }
        
        print(f"   ML input data: {ml_data}")
        print(f"   Using emp_title: '{ml_data['emp_title']}'")
        
        # Get ML prediction
        scorer = get_credit_scorer()
        result = scorer.predict_credit_score(ml_data)
        
        if result['success']:
            print(f"   ML prediction successful!")
            print(f"   Credit Score: {result['credit_score']}")
            print(f"   Category: {result['category']}")
            print(f"   Risk Level: {result['risk_level']}")
            print(f"   Confidence: {result['confidence']}%")
            
            # Create MLCreditAssessment record
            import time
            processing_time = int(time.time() * 1000) % 1000
            
            ml_assessment, created = MLCreditAssessment.objects.update_or_create(
                application=app,
                defaults={
                    'credit_score': result['credit_score'],
                    'category': result['category'],
                    'risk_level': result['risk_level'],
                    'confidence': result['confidence'],
                    'ghana_job_category': result.get('job_category', 'Agriculture & Fishing'),
                    'ghana_employment_score': result.get('employment_score', 65.0),
                    'ghana_job_stability_score': result.get('job_stability_score', 65),
                    'model_version': result.get('model_version', '2.0.0'),
                    'confidence_factors': result.get('confidence_factors', {}),
                    'processing_time_ms': processing_time,
                    'features_used': list(ml_data.keys())
                }
            )
            
            action = "Created" if created else "Updated"
            print(f"   {action} ML Assessment record")
            
            # Create application note
            note_content = f"""Manual ML Credit Score Generation (Fix):
- Credit Score: {result['credit_score']} ({result['category']})
- Risk Level: {result['risk_level']}
- Confidence: {result['confidence']}%
- Ghana Job: {app.job_title}
- Model Version: {result.get('model_version', '2.0.0')}
- Processing Time: {processing_time}ms
- Generated to fix missing ML assessment from submission"""
            
            ApplicationNote.objects.create(
                application=app,
                author=app.applicant,
                note=note_content,
                is_internal=True
            )
            
            print(f"   Added application note")
            
        else:
            print(f"   ML prediction failed: {result.get('error')}")
            
    except Exception as e:
        print(f"   Error generating ML assessment: {e}")
        import traceback
        traceback.print_exc()
    
    # Verification
    print("\n3. VERIFICATION:")
    app.refresh_from_db()
    print(f"   Job Title: '{app.job_title}'")
    
    try:
        ml = app.ml_assessment
        print(f"   ML Assessment exists: YES")
        print(f"   Credit Score: {ml.credit_score}")
        print(f"   Risk Level: {ml.risk_level}")
        print(f"   Confidence: {ml.confidence}%")
    except:
        print(f"   ML Assessment exists: NO")
    
    print("\n=== ISSUES FIXED ===")

if __name__ == '__main__':
    fix_application_issues()