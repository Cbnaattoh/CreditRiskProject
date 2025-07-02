import streamlit as st
import pandas as pd                                                                                             
import xgboost as xgb
import pickle
import numpy as np
import re
from utils import clean_emp_length, get_preprocessor, get_feature_names

# Set page configuration
st.set_page_config(page_title="Credit Risk Prediction - Demo", layout="centered")

def load_model_and_preprocessor():
    """Load the trained model, preprocessor, and metrics."""
    model_path = 'C:\\Users\\Lenovo-T15p\\Desktop\\Capstone_project\\CreditRiskProject\\Backend\\ml_model\\models\\xgboost_credit_score_model.pkl'
    preprocessor_path = 'C:\\Users\\Lenovo-T15p\\Desktop\\Capstone_project\\CreditRiskProject\\Backend\\ml_model\\models\\preprocessor.pkl'
    metrics_path = 'C:\\Users\\Lenovo-T15p\\Desktop\\Capstone_project\\CreditRiskProject\\Backend\\ml_model\\models\\model_metrics.pkl'
    try:
        with open(model_path, 'rb') as model_file:
            model = pickle.load(model_file)
        with open(preprocessor_path, 'rb') as preprocessor_file:
            preprocessor = pickle.load(preprocessor_file)
        with open(metrics_path, 'rb') as metrics_file:
            metrics = pickle.load(metrics_file)
        return model, preprocessor, metrics
    except FileNotFoundError as e:
        st.error(f"Error: Model or preprocessor file not found. Please run train.py first. ({e})")
        return None, None, None

def validate_emp_length(emp_length):
    """Validate employment length format."""
    pattern = r'^(\d+ years|10\+ years|< 1 year)$'
    if not re.match(pattern, emp_length.strip()):
        return False, "Invalid format. Use 'X years', '10+ years', or '< 1 year' (e.g., '5 years')."
    return True, clean_emp_length(emp_length)

def preprocess_input(features, preprocessor, features_list, categorical_features):
    """Preprocess user input to match the model's expected format."""
    input_df = pd.DataFrame([features])
    if 'home_ownership' in input_df.columns:
        input_df['home_ownership'] = input_df['home_ownership'].astype('category')
    try:
        X_processed = preprocessor.transform(input_df[features_list])
        feature_names = get_feature_names(preprocessor, features_list, categorical_features)
        return pd.DataFrame(X_processed, columns=feature_names)
    except Exception as e:
        st.error(f"Error in preprocessing: {e}")
        return None

def get_credit_score_category(score):
    """Map the predicted credit score to a category."""
    score = int(round(score))  # Round to nearest integer
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
    try:
        return model.predict(input_df)[0]
    except Exception as e:
        st.error(f"Error in prediction: {e}")
        return None

def main():
    # Title and description
    st.title("Credit Risk Prediction - Demo")
    st.markdown("""
        Enter your financial details below to predict your credit score.
        All monetary values should be in Ghanaian Cedi (GHC).
        Use the information section to understand how each input affects your score.
    """)

    # Information section
    with st.expander("How Inputs Affect Your Credit Score", expanded=False):
        st.markdown("""
            Below is an explanation of each input and its impact on your credit score:
            - **Annual Income (GHC)**: Higher income increases your score (positive impact).
            - **Debt-to-Income Ratio (%)**: Higher ratios decrease your score (negative impact).
            - **Interest Rate (%)**: Higher rates decrease your score (negative impact).
            - **Revolving Utilization Rate (%)**: Higher utilization decreases your score (negative impact).
            - **Number of Delinquencies in Past 2 Years**: More delinquencies decrease your score (negative impact).
            - **Number of Inquiries in Last 6 Months**: More inquiries decrease your score (negative impact).
            - **Employment Length**: Longer employment increases your score (positive impact).
            - **Number of Open Accounts**: More accounts slightly increase your score (positive impact).
            - **Collections in Past 12 Months (excluding medical)**: More collections decrease your score (negative impact).
            - **Loan Amount (GHC)**: Larger loans slightly decrease your score (negative impact).
            - **Credit History Length (years)**: Longer history increases your score (positive impact).
            - **Maximum Balance on Bankcards (GHC)**: Higher balances decrease your score (negative impact).
            - **Total Number of Accounts**: More accounts increase your score (positive impact).
            - **Number of Revolving Accounts Opened in Last 12 Months**: More accounts increase your score (positive impact).
            - **Number of Public Records**: More records decrease your score (negative impact).
            - **Home Ownership**: Owning or renting has a small positive impact compared to 'NONE' or 'OTHER'.
        """)

    # Define features
    features = [
        'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
        'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
        'loan_amnt', 'credit_history_length', 'max_bal_bc', 'total_acc',
        'open_rv_12m', 'pub_rec', 'home_ownership'
    ]

    # Load model, preprocessor, and metrics
    model, preprocessor, metrics = load_model_and_preprocessor()
    if model is None or preprocessor is None:
        return

    # Create a dummy DataFrame for preprocessor
    dummy_df = pd.DataFrame(columns=features)
    _, categorical_features = get_preprocessor(dummy_df, features)

    # Input form
    with st.form("credit_score_form"):
        st.subheader("Enter Your Financial Details")
        col1, col2 = st.columns(2)

        with col1:
            annual_inc = st.number_input("Annual Income (GHC)", min_value=5000.0, max_value=10000000.0, value=500000.0, step=1000.0, help="e.g., 500000 (5,000–10,000,000 GHC)")
            dti = st.number_input("Debt-to-Income Ratio (%)", min_value=0.0, max_value=100.0, value=20.0, step=0.1, help="e.g., 20 (0–100%)")
            int_rate = st.number_input("Interest Rate (%)", min_value=0.0, max_value=100.0, value=10.0, step=0.1, help="e.g., 10 (0–100%)")
            revol_util = st.number_input("Revolving Utilization Rate (%)", min_value=0.0, max_value=100.0, value=30.0, step=0.1, help="e.g., 30 (0–100%)")
            delinq_2yrs = st.number_input("Number of Delinquencies in Past 2 Years", min_value=0.0, max_value=50.0, value=0.0, step=1.0, help="e.g., 0 (0–50)")
            inq_last_6mths = st.number_input("Number of Inquiries in Last 6 Months", min_value=0.0, max_value=50.0, value=1.0, step=1.0, help="e.g., 1 (0–50)")
            emp_length = st.text_input("Employment Length (e.g., '5 years', '10+ years', '< 1 year')", value="5 years", help="e.g., 5 years")
            open_acc = st.number_input("Number of Open Accounts", min_value=0.0, max_value=100.0, value=10.0, step=1.0, help="e.g., 10 (0–100)")

        with col2:
            collections_12_mths_ex_med = st.number_input("Collections in Past 12 Months (excluding medical)", min_value=0.0, max_value=50.0, value=0.0, step=1.0, help="e.g., 0 (0–50)")
            loan_amnt = st.number_input("Loan Amount (GHC)", min_value=1000.0, max_value=1000000.0, value=100000.0, step=1000.0, help="e.g., 100000 (1,000–1,000,000 GHC)")
            credit_history_length = st.number_input("Credit History Length (years)", min_value=0.0, max_value=100.0, value=10.0, step=1.0, help="e.g., 10 (0–100 years)")
            max_bal_bc = st.number_input("Maximum Balance on Bankcards (GHC)", min_value=0.0, max_value=1000000.0, value=50000.0, step=1000.0, help="e.g., 50000 (0–1,000,000 GHC)")
            total_acc = st.number_input("Total Number of Accounts", min_value=0.0, max_value=200.0, value=15.0, step=1.0, help="e.g., 15 (0–200)")
            open_rv_12m = st.number_input("Number of Revolving Accounts Opened in Last 12 Months", min_value=0.0, max_value=50.0, value=2.0, step=1.0, help="e.g., 2 (0–50)")
            pub_rec = st.number_input("Number of Public Records", min_value=0.0, max_value=50.0, value=0.0, step=1.0, help="e.g., 0 (0–50)")
            if 'home_ownership' in categorical_features:
                home_ownership = st.selectbox("Home Ownership", ['MORTGAGE', 'RENT', 'OWN', 'NONE', 'OTHER'], index=1, help="e.g., RENT")
            else:
                home_ownership = None

        # Submit button
        submitted = st.form_submit_button("Predict Credit Score")

    if submitted:
        # Validate inputs
        errors = []
        if not (5000 <= annual_inc <= 10000000):
            errors.append("Annual Income must be between 5,000 and 10,000,000 GHC.")
        if not (0 <= dti <= 100):
            errors.append("Debt-to-Income Ratio must be between 0 and 100%.")
        if not (0 <= int_rate <= 100):
            errors.append("Interest Rate must be between 0 and 100%.")
        if not (0 <= revol_util <= 100):
            errors.append("Revolving Utilization Rate must be between 0 and 100%.")
        if not (0 <= delinq_2yrs <= 50):
            errors.append("Delinquencies in Past 2 Years must be between 0 and 50.")
        if not (0 <= inq_last_6mths <= 50):
            errors.append("Inquiries in Last 6 Months must be between 0 and 50.")
        is_valid_emp, emp_result = validate_emp_length(emp_length)
        if not is_valid_emp:
            errors.append(emp_result)
        if not (0 <= open_acc <= 100):
            errors.append("Number of Open Accounts must be between 0 and 100.")
        if not (0 <= collections_12_mths_ex_med <= 50):
            errors.append("Collections in Past 12 Months must be between 0 and 50.")
        if not (1000 <= loan_amnt <= 1000000):
            errors.append("Loan Amount must be between 1,000 and 1,000,000 GHC.")
        if not (0 <= credit_history_length <= 100):
            errors.append("Credit History Length must be between 0 and 100 years.")
        if not (0 <= max_bal_bc <= 1000000):
            errors.append("Maximum Balance on Bankcards must be between 0 and 1,000,000 GHC.")
        if not (0 <= total_acc <= 200):
            errors.append("Total Number of Accounts must be between 0 and 200.")
        if not (0 <= open_rv_12m <= 50):
            errors.append("Revolving Accounts Opened in Last 12 Months must be between 0 and 50.")
        if not (0 <= pub_rec <= 50):
            errors.append("Number of Public Records must be between 0 and 50.")
        if 'home_ownership' in categorical_features and home_ownership not in ['MORTGAGE', 'RENT', 'OWN', 'NONE', 'OTHER']:
            errors.append("Home Ownership must be one of: MORTGAGE, RENT, OWN, NONE, OTHER.")

        if errors:
            for error in errors:
                st.error(error)
            return

        # Collect features
        user_features = {
            'annual_inc': annual_inc,
            'dti': dti,
            'int_rate': int_rate,
            'revol_util': revol_util,
            'delinq_2yrs': delinq_2yrs,
            'inq_last_6mths': inq_last_6mths,
            'emp_length': emp_result,
            'open_acc': open_acc,
            'collections_12_mths_ex_med': collections_12_mths_ex_med,
            'loan_amnt': loan_amnt,
            'credit_history_length': credit_history_length,
            'max_bal_bc': max_bal_bc,
            'total_acc': total_acc,
            'open_rv_12m': open_rv_12m,
            'pub_rec': pub_rec,
        }
        if home_ownership:
            user_features['home_ownership'] = home_ownership

        # Preprocess input
        input_df = preprocess_input(user_features, preprocessor, features, categorical_features)
        if input_df is None:
            return

        # Predict credit score
        credit_score = predict_credit_score(model, input_df)
        if credit_score is None:
            return

        # Get credit score category and confidence level
        category = get_credit_score_category(credit_score)
        confidence_level = metrics['r2_score'] * 100

        # Display results with conditional background
        st.subheader("Prediction Results")
        if credit_score < 580:
            st.markdown(
                f"""
                <div style='background-color: red; color: white; padding: 10px; border-radius: 5px;'>
                    <strong>Predicted Credit Score</strong>: {credit_score:.0f}<br>
                    <strong>Credit Score Category</strong>: {category}<br>
                    <strong>Confidence Level</strong>: {confidence_level:.2f}%
                </div>
                """,
                unsafe_allow_html=True
            )
        elif 580 <= credit_score <= 739:
            st.markdown(
                f"""
                <div style='background-color: yellow; color: black; padding: 10px; border-radius: 5px;'>
                    <strong>Predicted Credit Score</strong>: {credit_score:.0f}<br>
                    <strong>Credit Score Category</strong>: {category}<br>
                    <strong>Confidence Level</strong>: {confidence_level:.2f}%
                </div>
                """,
                unsafe_allow_html=True
            )
        else:
            st.success(f"**Predicted Credit Score**: {credit_score:.0f}")
            st.success(f"**Credit Score Category**: {category}")
            st.success(f"**Confidence Level**: {confidence_level:.2f}%")

if __name__ == "__main__":
    main()