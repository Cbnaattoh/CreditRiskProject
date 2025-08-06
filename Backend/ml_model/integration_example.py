#!/usr/bin/env python3
"""
Integration Example for Credit Scoring ML Model
Demonstrates how to integrate the ML model into your backend application.
"""

from src.credit_scorer import CreditScorer, get_credit_scorer
from typing import Dict, List, Any
import json
from datetime import datetime

# Example 1: Basic Integration
def basic_integration_example():
    """Basic example of using the credit scorer."""
    print("=== BASIC INTEGRATION EXAMPLE ===")
    
    # Initialize scorer
    scorer = CreditScorer()
    
    # Load model
    if not scorer.load_model():
        print("ERROR: Failed to load model!")
        return
    
    print("SUCCESS: Model loaded successfully!")
    
    # Example application data
    application_data = {
        'annual_inc': 150000,  # GHS 12,500/month
        'dti': 15.0,           # 15% debt-to-income ratio
        'int_rate': 8.0,       # 8% interest rate
        'revol_util': 25.0,    # 25% credit utilization
        'delinq_2yrs': 0,      # No delinquencies
        'inq_last_6mths': 1,   # 1 recent inquiry
        'emp_length': '5 years',
        'emp_title': 'Software Engineer',  # Ghana employment analysis
        'open_acc': 12,
        'collections_12_mths_ex_med': 0,
        'loan_amnt': 25000,
        'credit_history_length': 10,
        'max_bal_bc': 3000,
        'total_acc': 18,
        'open_rv_12m': 1,
        'pub_rec': 0,
        'home_ownership': 'MORTGAGE'
    }
    
    # Get prediction
    result = scorer.predict_credit_score(application_data)
    
    if result['success']:
        print(f"SUCCESS: Credit Score: {result['credit_score']}")
        print(f"   Category: {result['category']}")
        print(f"   Risk Level: {result['risk_level']}")
        print(f"   Confidence: {result['confidence']:.1f}%")
        print(f"   Model Accuracy: {result.get('model_accuracy', 'N/A')}%")
    else:
        print(f"ERROR: Prediction failed: {result['error']}")

# Example 2: Batch Processing
def batch_processing_example():
    """Example of batch processing multiple applications."""
    print("\n=== BATCH PROCESSING EXAMPLE ===")
    
    # Use singleton instance for efficiency
    scorer = get_credit_scorer()
    
    # Multiple applications
    applications = [
        {
            'annual_inc': 80000, 'dti': 25.0, 'int_rate': 12.0, 'revol_util': 40.0,
            'emp_title': 'Teacher', 'emp_length': '3 years', 'home_ownership': 'RENT'
        },
        {
            'annual_inc': 200000, 'dti': 10.0, 'int_rate': 6.0, 'revol_util': 15.0,
            'emp_title': 'Bank Manager', 'emp_length': '10+ years', 'home_ownership': 'OWN'
        },
        {
            'annual_inc': 120000, 'dti': 20.0, 'int_rate': 9.0, 'revol_util': 30.0,
            'emp_title': 'Government Worker', 'emp_length': '7 years', 'home_ownership': 'MORTGAGE'
        }
    ]
    
    # Process batch
    results = scorer.batch_predict(applications)
    
    print(f"SUCCESS: Processed {len(applications)} applications:")
    for i, result in enumerate(results):
        if result['success']:
            print(f"   App {i+1}: Score {result['credit_score']} ({result['category']})")
        else:
            print(f"   App {i+1}: Failed - {result['error']}")

# Example 3: API Endpoint Simulation (FastAPI style)
def api_endpoint_simulation():
    """Simulate how to use the model in an API endpoint."""
    print("\n=== API ENDPOINT SIMULATION ===")
    
    # Global scorer instance (initialize once at app startup)
    global_scorer = get_credit_scorer()
    
    def predict_credit_score_endpoint(request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simulated API endpoint function."""
        try:
            # Validate required fields
            required_fields = ['annual_inc', 'dti', 'int_rate', 'revol_util']
            missing_fields = [field for field in required_fields if field not in request_data]
            
            if missing_fields:
                return {
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}',
                    'status_code': 400
                }
            
            # Get prediction
            result = global_scorer.predict_credit_score(request_data)
            
            if result['success']:
                return {
                    'status': 'success',
                    'data': {
                        'credit_score': result['credit_score'],
                        'category': result['category'],
                        'risk_level': result['risk_level'],
                        'confidence': round(result['confidence'], 1),
                        'model_accuracy': result.get('model_accuracy'),
                        'ghana_employment': {
                            'job_title': request_data.get('emp_title', 'Not specified'),
                            'employment_length': request_data.get('emp_length', 'Not specified')
                        }
                    },
                    'timestamp': result['prediction_timestamp'],
                    'status_code': 200
                }
            else:
                return {
                    'status': 'error',
                    'message': result['error'],
                    'validation_errors': result.get('validation_errors', []),
                    'status_code': 400
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Internal server error: {str(e)}',
                'status_code': 500
            }
    
    # Test the endpoint
    test_request = {
        'annual_inc': 180000,
        'dti': 12.0,
        'int_rate': 7.0,
        'revol_util': 20.0,
        'emp_title': 'Medical Doctor',
        'emp_length': '8 years',
        'home_ownership': 'OWN'
    }
    
    response = predict_credit_score_endpoint(test_request)
    print(f"API Response: {json.dumps(response, indent=2)}")

# Example 4: Model Health Monitoring
def health_monitoring_example():
    """Example of model health monitoring."""
    print("\n=== HEALTH MONITORING EXAMPLE ===")
    
    scorer = get_credit_scorer()
    
    # Get health status
    health = scorer.health_check()
    print(f"Model Status: {health['status']}")
    print(f"Model Loaded: {health['model_loaded']}")
    
    # Get performance metrics
    performance = scorer.get_model_performance()
    print(f"Model Accuracy: {performance.get('test_r2', 0) * 100:.2f}%")
    print(f"RMSE: {performance.get('test_rmse', 0):.1f} credit score points")
    print(f"MAE: {performance.get('test_mae', 0):.1f} credit score points")
    print(f"Model Version: {performance.get('version', 'unknown')}")

# Example 5: Ghana Employment Analysis
def ghana_employment_example():
    """Example showcasing Ghana employment features."""
    print("\n=== GHANA EMPLOYMENT ANALYSIS EXAMPLE ===")
    
    scorer = get_credit_scorer()
    
    # Test different Ghana job categories
    ghana_jobs = [
        ('Bank Manager', '10+ years', 250000),
        ('Government Worker', '8 years', 120000),
        ('Teacher', '5 years', 80000),
        ('Market Trader', '3 years', 60000),
        ('Security Guard', '2 years', 40000)
    ]
    
    print("Ghana Employment Impact Analysis:")
    for job_title, emp_length, income in ghana_jobs:
        test_data = {
            'annual_inc': income,
            'dti': 15.0,
            'int_rate': 8.0,
            'revol_util': 25.0,
            'emp_title': job_title,
            'emp_length': emp_length,
            'home_ownership': 'RENT'
        }
        
        result = scorer.predict_credit_score(test_data)
        if result['success']:
            print(f"  {job_title:20} | Income: GHS {income:,} | Score: {result['credit_score']:3d} ({result['category']})")

# Example 6: Error Handling
def error_handling_example():
    """Example of proper error handling."""
    print("\n=== ERROR HANDLING EXAMPLE ===")
    
    scorer = get_credit_scorer()
    
    # Test with invalid data
    invalid_data = {
        'annual_inc': -5000,  # Negative income
        'dti': 150.0,         # DTI > 100%
        'int_rate': 60.0,     # Very high interest rate
        'revol_util': 200.0   # Very high utilization
    }
    
    result = scorer.predict_credit_score(invalid_data)
    
    if not result['success']:
        print(f"ERROR: Validation Error: {result['error']}")
        if 'validation_errors' in result:
            print("   Specific errors:")
            for error in result['validation_errors']:
                print(f"   - {error}")
    
    # Test with missing data
    incomplete_data = {
        'annual_inc': 100000
        # Missing required fields
    }
    
    result2 = scorer.predict_credit_score(incomplete_data)
    if not result2['success']:
        print(f"ERROR: Missing Data Error: {result2['error']}")

def main():
    """Run all integration examples."""
    print("CREDIT SCORING ML MODEL - INTEGRATION EXAMPLES")
    print("=" * 60)
    
    try:
        basic_integration_example()
        batch_processing_example()
        api_endpoint_simulation()
        health_monitoring_example()
        ghana_employment_example()
        error_handling_example()
        
        print("\nCOMPLETE: All integration examples completed successfully!")
        print("\nNext steps:")
        print("1. Copy the relevant integration pattern to your backend")
        print("2. Install requirements: pip install -r requirements.txt")
        print("3. Test with your specific data")
        print("4. Implement proper error handling and logging")
        print("5. Add rate limiting and security measures")
        
    except Exception as e:
        print(f"ERROR: Example failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()