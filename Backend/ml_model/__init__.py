"""
Credit Risk ML Model Package
Production-ready machine learning model for credit risk assessment.

This package provides:
- Optimized XGBoost model for credit score prediction
- Balanced feature utilization (7/16 features contribute meaningfully)
- High accuracy (R² = 0.994) with cross-validation
- Production-ready API for Django integration
- Comprehensive input validation and error handling

Quick Usage:
    from ml_model.scripts.predict_api import predict_application_risk
    
    result = predict_application_risk({
        'annual_inc': 75000,
        'dti': 15.5,
        'int_rate': 8.5,
        'revol_util': 30.0,
        'emp_length': '5 years',
        'loan_amnt': 25000,
        # ... other features
    })
    
    credit_score = result['credit_score']
    category = result['category']  # Poor, Fair, Good, Very Good, Exceptional
    risk_level = result['risk_level']  # Low, Medium, High, Very High Risk
"""

__version__ = "1.0.0"
__author__ = "Credit Risk Assessment Team"

# Model performance metrics
MODEL_PERFORMANCE = {
    'r2_score': 0.994,
    'meaningful_features': 7,
    'total_features': 23,
    'contribution_rate': 30.4,
    'score_range': (300, 850)
}

# Feature importance (top features)
TOP_FEATURES = [
    'delinq_2yrs',          # 28.72% - Delinquencies in past 2 years
    'open_rv_12m',          # 23.32% - Revolving accounts opened in last 12 months  
    'revol_util',           # 14.88% - Revolving credit utilization
    'home_ownership_encoded', # 11.30% - Home ownership status
    'inq_last_6mths',       # 3.14% - Credit inquiries in last 6 months
    'dti',                  # 3.00% - Debt-to-income ratio
    'annual_inc'            # 1.05% - Annual income
]

# Available prediction categories
SCORE_CATEGORIES = {
    'Poor': (300, 579),
    'Fair': (580, 669), 
    'Good': (670, 739),
    'Very Good': (740, 799),
    'Exceptional': (800, 850)
}

# Required input features for prediction (including engineered features)
REQUIRED_FEATURES = [
    'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
    'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
    'loan_amnt', 'credit_history_length', 'max_bal_bc', 'total_acc',
    'open_rv_12m', 'pub_rec', 'home_ownership_encoded', 'debt_amount',
    'estimated_credit_limit', 'loan_to_income_ratio', 'closed_acc',
    'account_utilization', 'high_risk_indicator', 'credit_experience'
]