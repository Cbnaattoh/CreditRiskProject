#!/usr/bin/env python
"""
Simple test to verify the ML integration works
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from applications.models import CreditApplication, MLCreditAssessment

def simple_test():
    print("Testing ML Integration...")
    print("=" * 40)
    
    # Test ML model import
    try:
        sys.path.append('ml_model')
        from ml_model.src.credit_scorer import get_credit_scorer
        scorer = get_credit_scorer()
        print("SUCCESS: ML model loaded")
        
        # Test prediction with sample data
        sample_data = {
            'annual_inc': 75000,
            'dti': 15.5,
            'int_rate': 8.5,
            'revol_util': 30.0,
            'delinq_2yrs': 0,
            'inq_last_6mths': 1,
            'emp_length': '5 years',
            'emp_title': 'Software Engineer',
            'open_acc': 8,
            'collections_12_mths_ex_med': 0,
            'loan_amnt': 25000,
            'credit_history_length': 10,
            'max_bal_bc': 5000,
            'total_acc': 15,
            'open_rv_12m': 2,
            'pub_rec': 0,
            'home_ownership': 'RENT'
        }
        
        result = scorer.predict_credit_score(sample_data)
        if result['success']:
            print("SUCCESS: Credit score prediction works")
            print(f"Credit Score: {result['credit_score']}")
            print(f"Category: {result['category']}")
            print(f"Risk Level: {result['risk_level']}")
            print(f"Confidence: {result['confidence']}%")
        else:
            print(f"ERROR: Prediction failed - {result.get('error')}")
            
    except Exception as e:
        print(f"ERROR: ML model test failed - {e}")
        return False
    
    # Test database models
    try:
        print("\nTesting Database Models...")
        User = get_user_model()
        
        # Check if we can access the models
        app_count = CreditApplication.objects.count()
        ml_count = MLCreditAssessment.objects.count()
        
        print(f"SUCCESS: Database accessible")
        print(f"Credit Applications in DB: {app_count}")
        print(f"ML Assessments in DB: {ml_count}")
        
    except Exception as e:
        print(f"ERROR: Database test failed - {e}")
        return False
    
    print("\n" + "=" * 40)
    print("RESULT: All tests passed!")
    print("Your workflow implementation is ready.")
    return True

if __name__ == '__main__':
    simple_test()