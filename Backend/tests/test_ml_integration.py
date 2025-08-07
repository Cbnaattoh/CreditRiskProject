#!/usr/bin/env python3
"""
ML API Integration Test Script

This script tests the ML API integration by making sample requests
and verifying the response format matches the frontend expectations.

Run this script from the project root:
    python test_ml_integration.py
"""

import json
import requests
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000/api/ml"
TEST_USER_EMAIL = "admin@creditrisk.com"
TEST_PASSWORD = "testpass123"

def get_auth_token():
    """Get authentication token for API testing"""
    auth_url = "http://localhost:8000/api/auth/login/"
    
    auth_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(auth_url, json=auth_data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get('access_token') or token_data.get('access')
        else:
            print(f"❌ Failed to authenticate: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Make sure it's running on http://localhost:8000")
        return None
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return None

def test_model_health(token):
    """Test the model health endpoint"""
    print("\n🔍 Testing ML Model Health Endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        response = requests.get(f"{BASE_URL}/health/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Health check successful!")
            print(f"Model Status: {health_data.get('status', 'unknown')}")
            print(f"Model Loaded: {health_data.get('model_loaded', 'unknown')}")
            print(f"Accuracy: {health_data.get('accuracy', 'unknown')}")
            print(f"Version: {health_data.get('version', 'unknown')}")
            return True
        else:
            print(f"❌ Health check failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_model_documentation():
    """Test the model documentation endpoint (public)"""
    print("\n📚 Testing ML Model Documentation Endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs/")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            docs_data = response.json()
            print("✅ Documentation retrieved successfully!")
            print(f"API Version: {docs_data.get('api_version', 'unknown')}")
            print(f"Model Name: {docs_data.get('model_info', {}).get('name', 'unknown')}")
            print(f"Specialization: {docs_data.get('model_info', {}).get('specialization', 'unknown')}")
            
            # Check required fields
            required_fields = docs_data.get('required_fields', {})
            print(f"\nRequired Fields Count: {len(required_fields)}")
            
            # Check Ghana job categories
            job_categories = docs_data.get('ghana_job_categories', [])
            print(f"Ghana Job Categories: {len(job_categories)}")
            
            return True
        else:
            print(f"❌ Documentation retrieval failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Documentation error: {str(e)}")
        return False

def test_credit_score_prediction(token):
    """Test the credit score prediction endpoint"""
    print("\n🎯 Testing Credit Score Prediction Endpoint...")
    
    if not token:
        print("❌ Cannot test prediction without authentication token")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Sample prediction data
    prediction_data = {
        "annual_income": 150000,
        "loan_amount": 75000,
        "interest_rate": 12.5,
        "debt_to_income_ratio": 25.0,
        "credit_history_length": 7.0,
        "total_accounts": 8,
        "employment_length": "5 years",
        "job_title": "Software Engineer",
        "home_ownership": "RENT",
        "revolving_utilization": 15.0,
        "open_accounts": 5,
        "delinquencies_2yr": 0,
        "inquiries_6mo": 1,
        "revolving_accounts_12mo": 1,
        "public_records": 0,
        "collections_12mo": 0
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict/", headers=headers, json=prediction_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            prediction_result = response.json()
            print("✅ Prediction successful!")
            
            # Validate response structure
            if prediction_result.get('success'):
                print(f"Credit Score: {prediction_result.get('credit_score', 'N/A')}")
                print(f"Category: {prediction_result.get('category', 'N/A')}")
                print(f"Risk Level: {prediction_result.get('risk_level', 'N/A')}")
                print(f"Confidence: {prediction_result.get('confidence', 'N/A')}%")
                
                # Check Ghana employment analysis
                ghana_analysis = prediction_result.get('ghana_employment_analysis', {})
                if ghana_analysis:
                    print(f"\nGhana Employment Analysis:")
                    print(f"  Job Category: {ghana_analysis.get('job_category', 'N/A')}")
                    print(f"  Stability Score: {ghana_analysis.get('stability_score', 'N/A')}")
                
                # Check model info
                model_info = prediction_result.get('model_info', {})
                if model_info:
                    print(f"\nModel Info:")
                    print(f"  Version: {model_info.get('version', 'N/A')}")
                    print(f"  Accuracy: {model_info.get('accuracy', 'N/A')}")
                    print(f"  Model Type: {model_info.get('model_type', 'N/A')}")
                
                print(f"\nProcessing Time: {prediction_result.get('processing_time_ms', 'N/A')} ms")
                return True
            else:
                print(f"❌ Prediction failed: {prediction_result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Prediction request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        return False

def test_batch_prediction(token):
    """Test the batch prediction endpoint"""
    print("\n📊 Testing Batch Prediction Endpoint...")
    
    if not token:
        print("❌ Cannot test batch prediction without authentication token")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Sample batch prediction data (2 predictions)
    batch_data = {
        "predictions": [
            {
                "annual_income": 120000,
                "loan_amount": 50000,
                "interest_rate": 10.5,
                "debt_to_income_ratio": 20.0,
                "credit_history_length": 5.0,
                "total_accounts": 6,
                "employment_length": "3 years",
                "job_title": "Teacher",
                "home_ownership": "OWN"
            },
            {
                "annual_income": 180000,
                "loan_amount": 100000,
                "interest_rate": 15.0,
                "debt_to_income_ratio": 35.0,
                "credit_history_length": 10.0,
                "total_accounts": 12,
                "employment_length": "10+ years",
                "job_title": "Doctor",
                "home_ownership": "MORTGAGE"
            }
        ],
        "include_detailed_analysis": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/batch-predict/", headers=headers, json=batch_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            batch_result = response.json()
            print("✅ Batch prediction successful!")
            
            print(f"Total Predictions: {batch_result.get('total_predictions', 0)}")
            print(f"Successful: {batch_result.get('successful_predictions', 0)}")
            print(f"Failed: {batch_result.get('failed_predictions', 0)}")
            
            processing_summary = batch_result.get('processing_summary', {})
            if processing_summary:
                print(f"Processing Time: {processing_summary.get('processing_time_ms', 'N/A')} ms")
                print(f"Success Rate: {processing_summary.get('success_rate', 'N/A')}%")
            
            # Show first result if available
            results = batch_result.get('results', [])
            if results:
                first_result = results[0]
                if first_result.get('success'):
                    print(f"\nFirst Result:")
                    print(f"  Credit Score: {first_result.get('credit_score', 'N/A')}")
                    print(f"  Category: {first_result.get('category', 'N/A')}")
                    print(f"  Risk Level: {first_result.get('risk_level', 'N/A')}")
            
            return True
        else:
            print(f"❌ Batch prediction failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Batch prediction error: {str(e)}")
        return False

def generate_test_report(results):
    """Generate a test report"""
    print("\n" + "="*60)
    print("🎯 ML API INTEGRATION TEST REPORT")
    print("="*60)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    failed_tests = total_tests - passed_tests
    
    print(f"📊 Test Summary:")
    print(f"   Total Tests: {total_tests}")
    print(f"   ✅ Passed: {passed_tests}")
    print(f"   ❌ Failed: {failed_tests}")
    print(f"   Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    print(f"\n📋 Detailed Results:")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    if failed_tests == 0:
        print(f"\n🎉 All tests passed! ML API integration is working correctly.")
        print("\n🔧 Next Steps:")
        print("   1. Frontend should be able to make ML predictions")
        print("   2. Check the Home dashboard for the ML widget")
        print("   3. Test the credit score calculation form")
    else:
        print(f"\n⚠️  Some tests failed. Check the Django server and ML model setup.")
        print("\n🔧 Troubleshooting:")
        print("   1. Ensure Django server is running (python manage.py runserver)")
        print("   2. Check if ML model is properly loaded")
        print("   3. Verify user authentication is working")
        print("   4. Check Django logs for any errors")

def main():
    """Main function to run all ML API integration tests"""
    print("🚀 Starting ML API Integration Tests")
    print("="*60)
    print(f"🎯 Target URL: {BASE_URL}")
    print(f"👤 Test User: {TEST_USER_EMAIL}")
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Get authentication token
    print("\n🔐 Getting authentication token...")
    token = get_auth_token()
    if token:
        print("✅ Authentication successful!")
    else:
        print("⚠️  Authentication failed - will test public endpoints only")
    
    # Run tests
    results['Documentation'] = test_model_documentation()
    results['Health Check'] = test_model_health(token)
    results['Credit Prediction'] = test_credit_score_prediction(token)
    results['Batch Prediction'] = test_batch_prediction(token)
    
    # Generate report
    generate_test_report(results)

if __name__ == "__main__":
    main()