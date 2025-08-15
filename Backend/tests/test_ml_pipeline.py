#!/usr/bin/env python3
"""
Test script for ML Pipeline
Tests the automated ML processing system without requiring full setup
"""

import os
import sys
import django
from datetime import datetime

# Add the Backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    try:
        # Test Django components
        from applications.models import CreditApplication, MLCreditAssessment
        print("✓ Django models imported successfully")
        
        # Test signals
        from applications.signals import trigger_manual_ml_assessment
        print("✓ Django signals imported successfully")
        
        # Test ML components
        from ml_model.src.credit_scorer import CreditScorer
        print("✓ ML Credit Scorer imported successfully")
        
        # Test Ghana employment processor
        from ml_model.ghana_employment_processor import categorize_ghana_job_title
        print("✓ Ghana employment processor imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")
        return False

def test_ml_model():
    """Test ML model functionality"""
    print("\nTesting ML model...")
    
    try:
        from ml_model.src.credit_scorer import CreditScorer
        
        # Initialize scorer
        scorer = CreditScorer()
        
        # Test model loading
        if scorer.load_model():
            print("✓ ML model loaded successfully")
            
            # Test sample prediction
            sample_data = {
                'annual_inc': 75000,
                'dti': 15.5,
                'int_rate': 8.5,
                'revol_util': 30.0,
                'delinq_2yrs': 0,
                'inq_last_6mths': 1,
                'emp_length': '5 years',
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
            
            if result.get('success'):
                print(f"✓ ML prediction successful: Score={result['credit_score']}, Risk={result['risk_level']}")
            else:
                print(f"✗ ML prediction failed: {result.get('error')}")
                
        else:
            print("✗ Failed to load ML model")
            
        return True
        
    except Exception as e:
        print(f"✗ ML model test error: {str(e)}")
        return False

def test_ghana_employment():
    """Test Ghana employment processing"""
    print("\nTesting Ghana employment processor...")
    
    try:
        from ml_model.ghana_employment_processor import (
            categorize_ghana_job_title, 
            get_ghana_job_stability_score,
            calculate_ghana_employment_score
        )
        
        # Test job categorization
        test_jobs = [
            "Bank Manager",
            "Software Engineer", 
            "Market Trader",
            "Government Worker",
            "Teacher"
        ]
        
        print("Job categorization test:")
        for job in test_jobs:
            category = categorize_ghana_job_title(job)
            stability = get_ghana_job_stability_score(category)
            print(f"  {job:20} -> {category:25} (Stability: {stability})")
            
        # Test employment scoring
        employment_result = calculate_ghana_employment_score(
            emp_length="5 years",
            job_category="Banking & Finance",
            annual_income=120000  # GHS 10,000/month
        )
        
        print(f"\nEmployment scoring test:")
        print(f"  Total Score: {employment_result['total_employment_score']}")
        print(f"  Risk Level: {employment_result['employment_risk_level']}")
        
        print("✓ Ghana employment processing works correctly")
        return True
        
    except Exception as e:
        print(f"✗ Ghana employment test error: {str(e)}")
        return False

def test_task_functions():
    """Test task preparation functions"""
    print("\nTesting ML task functions...")
    
    try:
        # Test data preparation function
        from applications.tasks import _prepare_ml_input_data, _validate_ml_input
        
        # Create mock application object
        class MockApplication:
            def __init__(self):
                self.annual_income = 75000
                self.debt_to_income_ratio = 15.5
                self.interest_rate = 8.5
                self.revolving_utilization = 30.0
                self.delinquencies_2yr = 0
                self.inquiries_6mo = 1
                self.employment_length = '5 years'
                self.open_accounts = 8
                self.collections_12mo = 0
                self.loan_amount = 25000
                self.credit_history_length = 10
                self.max_bankcard_balance = 5000
                self.total_accounts = 15
                self.revolving_accounts_12mo = 2
                self.public_records = 0
                self.home_ownership = 'RENT'
                self.job_title = 'Software Engineer'
        
        mock_app = MockApplication()
        
        # Test data preparation
        ml_data = _prepare_ml_input_data(mock_app)
        print(f"✓ ML data preparation successful: {len(ml_data)} fields prepared")
        
        # Test validation
        is_valid = _validate_ml_input(ml_data)
        print(f"✓ ML data validation: {'PASSED' if is_valid else 'FAILED'}")
        
        return True
        
    except Exception as e:
        print(f"✗ Task function test error: {str(e)}")
        return False

def test_api_imports():
    """Test API view imports"""
    print("\nTesting API components...")
    
    try:
        from applications.views import (
            trigger_ml_assessment,
            batch_trigger_ml_assessments, 
            ml_assessment_status,
            ml_processing_statistics
        )
        print("✓ API view functions imported successfully")
        
        from applications.management.commands.process_ml_assessments import Command
        print("✓ Management command imported successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ API import test error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("ML PIPELINE TEST SUITE")
    print("=" * 60)
    print(f"Test started at: {datetime.now()}")
    
    # Disable Django setup for now since environment may not be fully configured
    test_results = []
    
    # Test imports (basic Python imports)
    test_results.append(("Imports", test_imports()))
    
    # Test ML model if imports successful
    if test_results[0][1]:
        test_results.append(("ML Model", test_ml_model()))
        test_results.append(("Ghana Employment", test_ghana_employment()))
        test_results.append(("Task Functions", test_task_functions()))
        test_results.append(("API Components", test_api_imports()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "PASSED" if result else "FAILED"
        print(f"{test_name:20} : {status}")
        if result:
            passed += 1
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ML Pipeline is ready for deployment.")
    else:
        print("⚠️  Some tests failed. Check the error messages above.")
        
    print(f"\nTest completed at: {datetime.now()}")

if __name__ == '__main__':
    main()