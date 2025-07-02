import pandas as pd
import xgboost as xgb
import pickle
import numpy as np
from utils import clean_emp_length, get_preprocessor, get_feature_names

def load_model_and_preprocessor():
    """Load the trained model, preprocessor, and metrics."""
    model_path = 'C:\\Users\\Lenovo-T15p\\Desktop\\Capstone_project\\CreditRiskProject\\Backend\\ml_model\\models\\xgboost_credit_score_model.pkl'
    preprocessor_path = 'C:\\Users\\Lenovo-T15p\\Desktop\\Capstone_project\\CreditRiskProject\\Backend\\ml_model\\models\\preprocessor.pkl'
    metrics_path = 'C:\\Users\\Lenovo-T15p\\Desktop\\Capstone_project\\CreditRiskProject\\Backend\\ml_model\\models\\model_metrics.pkl'
    with open(model_path, 'rb') as model_file:
        model = pickle.load(model_file)
    with open(preprocessor_path, 'rb') as preprocessor_file:
        preprocessor = pickle.load(preprocessor_file)
    with open(metrics_path, 'rb') as metrics_file:
        metrics = pickle.load(metrics_file)
    return model, preprocessor, metrics

def validate_numeric_input(prompt, example, min_val=0, max_val=float('inf')):
    """Validate numeric input with retry."""
    while True:
        try:
            value = float(input(f"{prompt} [e.g., {example}]: "))
            if min_val <= value <= max_val:
                return value
            else:
                print(f"Value must be between {min_val} and {max_val}. Try again.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def validate_home_ownership(prompt, example):
    """Validate home_ownership input with retry."""
    valid_options = ['MORTGAGE', 'RENT', 'OWN', 'NONE', 'OTHER']
    while True:
        value = input(f"{prompt} [e.g., {example}]: ").upper()
        if value in valid_options:
            return value
        else:
            print(f"Invalid input. Choose from {valid_options}. Try again.")

def get_user_input(has_home_ownership):
    """Collect and validate user input for features required by the model."""
    print("Enter the following information to predict your credit score (monetary values in GHC):")
    features = {
        'annual_inc': validate_numeric_input("Annual Income (GHC)", "500000", min_val=0),
        'dti': validate_numeric_input("Debt-to-Income Ratio (%)", "20", min_val=0, max_val=100),
        'int_rate': validate_numeric_input("Interest Rate (%)", "10", min_val=0, max_val=100),
        'revol_util': validate_numeric_input("Revolving Utilization Rate (%)", "30", min_val=0, max_val=100),
        'delinq_2yrs': validate_numeric_input("Number of Delinquencies in Past 2 Years", "0", min_val=0),
        'inq_last_6mths': validate_numeric_input("Number of Inquiries in Last 6 Months", "1", min_val=0),
        'emp_length': clean_emp_length(input("Employment Length (e.g., '5 years', '10+ years', '< 1 year') [e.g., 5 years]: ")),
        'open_acc': validate_numeric_input("Number of Open Accounts", "10", min_val=0),
        'collections_12_mths_ex_med': validate_numeric_input("Collections in Past 12 Months (excluding medical)", "0", min_val=0),
        'loan_amnt': validate_numeric_input("Loan Amount (GHC)", "100000", min_val=0),
        'credit_history_length': validate_numeric_input("Credit History Length (years)", "10", min_val=0),
        'max_bal_bc': validate_numeric_input("Maximum Balance on Bankcards (GHC)", "50000", min_val=0),
        'total_acc': validate_numeric_input("Total Number of Accounts", "15", min_val=0),
        'open_rv_12m': validate_numeric_input("Number of Revolving Accounts Opened in Last 12 Months", "2", min_val=0),
        'pub_rec': validate_numeric_input("Number of Public Records", "0", min_val=0),
    }
    if has_home_ownership:
        features['home_ownership'] = validate_home_ownership("Home Ownership (MORTGAGE, RENT, OWN, NONE, OTHER)", "RENT")
    return features

def preprocess_input(features, preprocessor, features_list, categorical_features):
    """Preprocess user input to match the model's expected format."""
    input_df = pd.DataFrame([features])
    if 'home_ownership' in input_df.columns:
        input_df['home_ownership'] = input_df['home_ownership'].astype('category')
    X_processed = preprocessor.transform(input_df[features_list])
    feature_names = get_feature_names(preprocessor, features_list, categorical_features)
    return pd.DataFrame(X_processed, columns=feature_names)

def get_credit_score_category(score):
    """Map the predicted credit score to a category."""
    if 300 <= score <= 579:
        return "Poor"
    elif 580 <= score <= 669:
        return "Fair"
    elif 670 <= score <= 739:
        return "Good"
    elif 740 <= score <= 799:
        return "Very Good"
    elif 800 <= score <= 850:
        return "Exceptional"
    else:
        return "Invalid Score"

def predict_credit_score(model, input_df):
    """Predict the credit score using the loaded model."""
    return model.predict(input_df)[0]

def main():
    # Load model, preprocessor, and metrics
    model, preprocessor, metrics = load_model_and_preprocessor()
    # Define features for preprocessor
    features = [
        'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
        'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
        'loan_amnt', 'credit_history_length', 'max_bal_bc', 'total_acc',
        'open_rv_12m', 'pub_rec', 'home_ownership'
    ]
    # Create a dummy DataFrame with relevant columns
    dummy_df = pd.DataFrame(columns=features)
    _, categorical_features = get_preprocessor(dummy_df, features)
    
    # Get user input
    user_features = get_user_input(has_home_ownership='home_ownership' in categorical_features)
    
    # Preprocess input
    input_df = preprocess_input(user_features, preprocessor, features, categorical_features)
    
    # Predict credit score
    credit_score = predict_credit_score(model, input_df)
    
    # Get credit score category
    category = get_credit_score_category(credit_score)
    
    # Calculate confidence level as R-squared * 100%
    confidence_level = metrics['r2_score'] * 100
    
    # Display results
    print(f"\nPredicted Credit Score: {credit_score:.0f}")
    print(f"Credit Score Category: {category}")
    print(f"Confidence Level: {confidence_level:.2f}%")

if __name__ == "__main__":
    main()