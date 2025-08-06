#!/usr/bin/env python
"""
Test ML model availability and functionality
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

def test_ml_model():
    print("=== TESTING ML MODEL AVAILABILITY ===")
    
    # Test 1: Check if ML model files exist
    print("\n1. Checking ML model files:")
    model_files = [
        'ml_model/src/credit_scorer.py',
        'ml_model/models/xgboost_credit_model_fixed.pkl',
        'ml_model/models/preprocessor.pkl',
        'ml_model/models/feature_names.pkl'
    ]
    
    for file_path in model_files:
        full_path = os.path.join(os.path.dirname(__file__), file_path)
        exists = os.path.exists(full_path)
        print(f"   {file_path}: {'EXISTS' if exists else 'MISSING'}")
    
    # Test 2: Try importing the ML model
    print("\n2. Testing ML model import:")
    try:
        from src.credit_scorer import get_credit_scorer
        print("   Import successful: YES")
        
        # Test 3: Initialize scorer
        print("\n3. Testing scorer initialization:")
        scorer = get_credit_scorer()
        print("   Scorer initialization: SUCCESS")
        
        # Test 4: Test prediction with sample data
        print("\n4. Testing prediction with sample data:")
        sample_data = {
            'annual_inc': 68000.0,
            'dti': 15.0,
            'int_rate': 12.5,
            'revol_util': 25.0,
            'delinq_2yrs': 0,
            'inq_last_6mths': 1,
            'emp_length': '5 years',
            'emp_title': 'Farmer',
            'open_acc': 5,
            'collections_12_mths_ex_med': 0,
            'loan_amnt': 4000.0,
            'credit_history_length': 2.0,
            'max_bal_bc': 1000.0,
            'total_acc': 8,
            'open_rv_12m': 2,
            'pub_rec': 0,
            'home_ownership': 'OWN'
        }
        
        print(f"   Sample data: {sample_data}")
        result = scorer.predict_credit_score(sample_data)
        print(f"   Prediction result: {result}")
        
        if result.get('success'):
            print(f"   Credit Score: {result.get('credit_score')}")
            print(f"   Category: {result.get('category')}")
            print(f"   Risk Level: {result.get('risk_level')}")
            print(f"   Confidence: {result.get('confidence')}%")
            print(f"   Ghana Job Category: {result.get('job_category')}")
        else:
            print(f"   Prediction failed: {result.get('error')}")
            
    except ImportError as e:
        print(f"   Import failed: {e}")
        print("   ML model is not available")
    except Exception as e:
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()

    # Test 5: Check if the issue is in the submission process
    print("\n5. Testing submission process simulation:")
    try:
        from applications.models import CreditApplication
        app = CreditApplication.objects.order_by('-last_updated').first()
        if app:
            print(f"   Using application: {app.id}")
            print(f"   Job title in app: '{app.job_title}'")
            print(f"   Annual income: {app.annual_income}")
            
            # Simulate the ML data preparation from views.py
            ml_data = {
                'annual_inc': float(app.annual_income or 0),
                'dti': float(app.debt_to_income_ratio or 0),
                'int_rate': float(app.interest_rate or 0),
                'revol_util': float(app.revolving_utilization or 0),
                'delinq_2yrs': int(app.delinquencies_2yr or 0),
                'inq_last_6mths': int(app.inquiries_6mo or 0),
                'emp_length': app.employment_length or '< 1 year',
                'emp_title': app.job_title or 'Other',  # This is the issue!
                'open_acc': int(app.open_accounts or 0),
                'collections_12_mths_ex_med': int(app.collections_12mo or 0),
                'loan_amnt': float(app.loan_amount or 0),
                'credit_history_length': float(app.credit_history_length or 0),
                'max_bal_bc': float(app.max_bankcard_balance or 0),
                'total_acc': int(app.total_accounts or 0),
                'open_rv_12m': int(app.revolving_accounts_12mo or 0),
                'pub_rec': int(app.public_records or 0),
                'home_ownership': app.home_ownership or 'RENT'
            }
            
            print(f"   ML data prepared: {ml_data}")
            print(f"   Notice emp_title: '{ml_data['emp_title']}'")
            
    except Exception as e:
        print(f"   Submission simulation error: {e}")

if __name__ == '__main__':
    test_ml_model()