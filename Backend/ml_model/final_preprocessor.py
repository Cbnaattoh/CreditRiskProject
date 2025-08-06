#!/usr/bin/env python3
"""
Final preprocessor that matches the retrained model with encoded categorical features.
Enhanced with Ghana-specific employment processing.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
try:
    from ghana_employment_processor import categorize_ghana_job_title, calculate_ghana_employment_score, get_ghana_job_stability_score
except ImportError:
    # Fallback functions if Ghana processor not available
    def categorize_ghana_job_title(title):
        return 'Other Services'
    def calculate_ghana_employment_score(emp_length, job_category, annual_income=None):
        return {'total_employment_score': 50.0}
    def get_ghana_job_stability_score(job_category):
        return 50

def preprocess_for_prediction_final(data: Dict[str, Any], model_dir: str) -> pd.DataFrame:
    """
    Preprocess data to match the retrained model format with encoded categorical features.
    
    Features expected by the new model:
    ['annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs', 'inq_last_6mths', 
     'open_acc', 'collections_12_mths_ex_med', 'loan_amnt', 'max_bal_bc', 'total_acc', 
     'open_rv_12m', 'pub_rec', 'credit_history_length', 'emp_length_encoded', 'home_ownership_encoded']
    """
    
    # Expected features in the exact order
    # Note: Ghana features are computed but not included in model input yet (model needs retraining)
    expected_features = [
        'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs', 'inq_last_6mths',
        'open_acc', 'collections_12_mths_ex_med', 'loan_amnt', 'max_bal_bc', 'total_acc', 
        'open_rv_12m', 'pub_rec', 'credit_history_length', 'emp_length_encoded', 'home_ownership_encoded'
    ]
    
    # Additional Ghana features for analysis (not yet in model)
    ghana_features = ['ghana_employment_score', 'ghana_job_stability_score']
    
    processed_data = {}
    
    # Process each feature
    for feature in expected_features:
        if feature == 'emp_length_encoded':
            # Convert employment length to encoded value
            emp_mapping = {
                '< 1 year': 0, '1 year': 1, '2 years': 2, '3 years': 3, '4 years': 4, '5 years': 5,
                '6 years': 6, '7 years': 7, '8 years': 8, '9 years': 9, '10+ years': 10
            }
            
            if 'emp_length' in data:
                emp_value = str(data['emp_length'])
                if emp_value in emp_mapping:
                    processed_data[feature] = float(emp_mapping[emp_value])
                else:
                    # Try to parse numeric value
                    try:
                        if '10+' in emp_value:
                            processed_data[feature] = 10.0
                        elif '< 1' in emp_value:
                            processed_data[feature] = 0.0
                        else:
                            # Extract number from string like "5 years"
                            num = float(''.join(filter(str.isdigit, emp_value)))
                            processed_data[feature] = min(max(num, 0), 10)  # Clamp to 0-10
                    except:
                        processed_data[feature] = 5.0  # Default to 5 years
            else:
                processed_data[feature] = 5.0  # Default
                
        elif feature == 'home_ownership_encoded':
            # Convert home ownership to encoded value
            home_mapping = {
                'OWN': 0,       # Lowest risk
                'MORTGAGE': 1,  # Low risk  
                'RENT': 2,      # Medium risk
                'OTHER': 3,     # Higher risk
                'NONE': 3,      # Higher risk
                'ANY': 3        # Higher risk
            }
            
            if 'home_ownership' in data:
                home_value = str(data['home_ownership']).upper()
                processed_data[feature] = float(home_mapping.get(home_value, 2))  # Default to RENT
            else:
                processed_data[feature] = 2.0  # Default to RENT
                
        elif feature in ['max_bal_bc', 'open_rv_12m']:
            # These were filled with 0 in training after being 100% missing
            processed_data[feature] = 0.0
            
        elif feature == 'ghana_employment_score':
            # Calculate Ghana employment score
            emp_length = data.get('emp_length', '5 years')
            emp_title = data.get('emp_title', '')
            annual_income = data.get('annual_inc', 50000)
            
            # Get Ghana job category
            job_category = categorize_ghana_job_title(emp_title)
            
            # Calculate comprehensive employment score
            employment_data = calculate_ghana_employment_score(emp_length, job_category, annual_income)
            processed_data[feature] = float(employment_data['total_employment_score'])
            
        elif feature == 'ghana_job_stability_score':
            # Get job stability score for Ghana context
            emp_title = data.get('emp_title', '')
            job_category = categorize_ghana_job_title(emp_title)
            processed_data[feature] = float(get_ghana_job_stability_score(job_category))
            
        else:
            # Numeric features - process normally
            if feature in data and data[feature] is not None:
                processed_data[feature] = float(data[feature])
            else:
                # Default values for missing numeric features
                defaults = {
                    'annual_inc': 50000.0, 'dti': 20.0, 'int_rate': 12.0, 
                    'revol_util': 50.0, 'delinq_2yrs': 0.0, 'inq_last_6mths': 1.0,
                    'open_acc': 8.0, 'collections_12_mths_ex_med': 0.0,
                    'loan_amnt': 10000, 'total_acc': 15.0, 'pub_rec': 0.0,
                    'credit_history_length': 10.0
                }
                processed_data[feature] = defaults.get(feature, 0.0)
    
    # Process Ghana features for analysis (store but don't include in model input yet)
    ghana_data = {}
    for feature in ghana_features:
        if feature == 'ghana_employment_score':
            emp_length = data.get('emp_length', '5 years')
            emp_title = data.get('emp_title', '')
            annual_income = data.get('annual_inc', 50000)
            job_category = categorize_ghana_job_title(emp_title)
            employment_data = calculate_ghana_employment_score(emp_length, job_category, annual_income)
            ghana_data[feature] = float(employment_data['total_employment_score'])
        elif feature == 'ghana_job_stability_score':
            emp_title = data.get('emp_title', '')
            job_category = categorize_ghana_job_title(emp_title)
            ghana_data[feature] = float(get_ghana_job_stability_score(job_category))
    
    # Create DataFrame with exact column order (model features only)
    df_final = pd.DataFrame([processed_data], columns=expected_features)
    
    # Add Ghana features as metadata (not for model prediction yet)
    for feature, value in ghana_data.items():
        df_final[feature] = value
    
    # Set correct data types
    for col in df_final.columns:
        if col == 'loan_amnt':
            df_final[col] = df_final[col].astype('int64')
        else:
            df_final[col] = df_final[col].astype('float64')
    
    return df_final

def validate_single_application(data: Dict[str, Any]) -> tuple:
    """Validate single application data."""
    errors = []
    
    # Required fields validation
    required_fields = ['annual_inc', 'dti', 'int_rate', 'revol_util']
    
    for field in required_fields:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")
        elif not isinstance(data[field], (int, float)) or data[field] < 0:
            errors.append(f"Invalid value for {field}: must be positive number")
    
    # Range validations
    if 'dti' in data and data['dti'] is not None:
        if data['dti'] > 100:
            errors.append("DTI ratio cannot exceed 100%")
    
    if 'revol_util' in data and data['revol_util'] is not None:
        if data['revol_util'] > 150:
            errors.append("Revolving utilization cannot exceed 150%")
    
    if 'int_rate' in data and data['int_rate'] is not None:
        if data['int_rate'] > 50:
            errors.append("Interest rate cannot exceed 50%")
    
    return len(errors) == 0, errors

if __name__ == "__main__":
    # Test the final preprocessor
    test_data = {
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
        'max_bal_bc': 5000,  # Will be set to 0
        'total_acc': 15,
        'open_rv_12m': 2,    # Will be set to 0
        'pub_rec': 0,
        'home_ownership': 'RENT'
    }
    
    result = preprocess_for_prediction_final(test_data, "models")
    print(f"Processed data shape: {result.shape}")
    print(f"Features: {list(result.columns)}")
    print("\nSample data:")
    for col in result.columns:
        print(f"  {col}: {result[col].iloc[0]}")
    
    # Test categorical variations
    print(f"\nTesting categorical variations:")
    
    # Test employment lengths
    for emp in ['< 1 year', '5 years', '10+ years']:
        test_data_emp = test_data.copy()
        test_data_emp['emp_length'] = emp
        result_emp = preprocess_for_prediction_final(test_data_emp, "models")
        print(f"  {emp} -> emp_length_encoded: {result_emp['emp_length_encoded'].iloc[0]}")
    
    # Test home ownership
    for home in ['RENT', 'OWN', 'MORTGAGE', 'OTHER']:
        test_data_home = test_data.copy()
        test_data_home['home_ownership'] = home
        result_home = preprocess_for_prediction_final(test_data_home, "models")
        print(f"  {home} -> home_ownership_encoded: {result_home['home_ownership_encoded'].iloc[0]}")