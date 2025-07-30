"""
Credit Risk Assessment - Streamlit App
Interactive web interface for credit score prediction
"""

import streamlit as st
import sys
import os
from typing import Dict, Any

# Add the ml_model directory to the path
ml_model_dir = os.path.dirname(os.path.abspath(__file__))
if ml_model_dir not in sys.path:
    sys.path.append(ml_model_dir)

try:
    from scripts.predict_api import predict_application_risk
except ImportError as e:
    st.error(f"Error importing prediction module: {e}")
    st.stop()

# Page configuration
st.set_page_config(
    page_title="Credit Risk Assessment",
    page_icon="💳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .section-header {
        font-size: 1.5rem;
        color: #2c3e50;
        margin-top: 2rem;
        margin-bottom: 1rem;
        border-bottom: 2px solid #3498db;
        padding-bottom: 0.5rem;
    }
    .result-container {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 2rem;
        margin: 1rem 0;
        border-left: 5px solid #3498db;
    }
    .score-display {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        margin: 1rem 0;
    }
    .risk-high {
        color: #e74c3c;
    }
    .risk-medium {
        color: #f39c12;
    }
    .risk-low {
        color: #27ae60;
    }
</style>
""", unsafe_allow_html=True)

def main():
    # Header
    st.markdown('<h1 class="main-header">💳 Credit Risk Assessment</h1>', unsafe_allow_html=True)
    st.markdown("**Predict credit scores using advanced machine learning model**")
    
    # Sidebar information
    with st.sidebar:
        st.header("ℹ️ Model Information")
        st.info("""
        **Model Performance:**
        - R² Score: 99.4%
        - Features: 23 (16 input + 7 engineered)
        - Score Range: 300-850
        - Categories: Poor, Fair, Good, Very Good, Exceptional
        """)
        
        st.header("📋 Instructions")
        st.write("""
        1. Fill in all required fields
        2. Use realistic values for accurate predictions
        3. Click 'Predict Credit Score' to get results
        4. Review the detailed breakdown
        """)
    
    # Create input form
    with st.form("credit_assessment_form"):
        # Financial Information Section
        st.markdown('<div class="section-header">💰 Financial Information</div>', unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        
        with col1:
            annual_inc = st.number_input(
                "Annual Income (GHC)",
                min_value=0,
                max_value=10000000,
                value=75000,
                step=5000,
                help="Your total annual income in Ghana Cedis"
            )
            
            loan_amnt = st.number_input(
                "Loan Amount Requested (GHC)",
                min_value=1000,
                max_value=1000000,
                value=25000,
                step=1000,
                help="The amount of loan you are applying for"
            )
        
        with col2:
            dti = st.number_input(
                "Debt-to-Income Ratio (%)",
                min_value=0.0,
                max_value=100.0,
                value=15.5,
                step=0.5,
                help="Your total monthly debt payments divided by monthly income"
            )
            
            int_rate = st.number_input(
                "Interest Rate (%)",
                min_value=0.0,
                max_value=50.0,
                value=8.5,
                step=0.1,
                help="The interest rate for your loan"
            )
        
        # Credit History Section
        st.markdown('<div class="section-header">📊 Credit History</div>', unsafe_allow_html=True)
        
        col3, col4 = st.columns(2)
        
        with col3:
            credit_history_length = st.number_input(
                "Credit History Length (years)",
                min_value=0,
                max_value=50,
                value=10,
                step=1,
                help="How long you have had credit accounts"
            )
            
            delinq_2yrs = st.number_input(
                "Delinquencies in Past 2 Years",
                min_value=0,
                max_value=20,
                value=0,
                step=1,
                help="Number of times you were 30+ days late on payments"
            )
        
        with col4:
            inq_last_6mths = st.number_input(
                "Credit Inquiries (Last 6 Months)",
                min_value=0,
                max_value=20,
                value=1,
                step=1,
                help="Number of times lenders checked your credit"
            )
            
            pub_rec = st.number_input(
                "Public Records",
                min_value=0,
                max_value=10,
                value=0,
                step=1,
                help="Number of public records (bankruptcies, liens, etc.)"
            )
        
        # Account Information Section
        st.markdown('<div class="section-header">🏦 Account Information</div>', unsafe_allow_html=True)
        
        col5, col6 = st.columns(2)
        
        with col5:
            open_acc = st.number_input(
                "Open Accounts",
                min_value=0,
                max_value=50,
                value=8,
                step=1,
                help="Number of currently open credit accounts"
            )
            
            total_acc = st.number_input(
                "Total Accounts",
                min_value=0,
                max_value=100,
                value=15,
                step=1,
                help="Total number of credit accounts you've ever had"
            )
            
            open_rv_12m = st.number_input(
                "New Revolving Accounts (Last 12 Months)",
                min_value=0,
                max_value=20,
                value=2,
                step=1,
                help="Revolving accounts opened in the last 12 months"
            )
        
        with col6:
            revol_util = st.number_input(
                "Credit Utilization (%)",
                min_value=0.0,
                max_value=100.0,
                value=30.0,
                step=1.0,
                help="Percentage of available credit you're using"
            )
            
            max_bal_bc = st.number_input(
                "Maximum Balance on Bankcards (GHC)",
                min_value=0,
                max_value=1000000,
                value=5000,
                step=100,
                help="Highest balance you've had on any bankcard"
            )
            
            collections_12_mths_ex_med = st.number_input(
                "Collections (Last 12 Months)",
                min_value=0,
                max_value=10,
                value=0,
                step=1,
                help="Collections in the last 12 months (excluding medical)"
            )
        
        # Personal Information Section
        st.markdown('<div class="section-header">👤 Personal Information</div>', unsafe_allow_html=True)
        
        col7, col8 = st.columns(2)
        
        with col7:
            emp_length = st.selectbox(
                "Employment Length",
                options=["< 1 year", "1 year", "2 years", "3 years", "4 years", 
                        "5 years", "6 years", "7 years", "8 years", "9 years", "10+ years"],
                index=4,
                help="How long you've been employed at your current job"
            )
        
        with col8:
            home_ownership = st.selectbox(
                "Home Ownership",
                options=["RENT", "OWN", "MORTGAGE", "NONE", "OTHER"],
                index=0,
                help="Your current housing situation"
            )
        
        # Submit button
        st.markdown("<br>", unsafe_allow_html=True)
        submitted = st.form_submit_button(
            "🎯 Predict Credit Score",
            use_container_width=True,
            type="primary"
        )
        
        if submitted:
            # Prepare data for prediction
            application_data = {
                'annual_inc': annual_inc,
                'dti': dti,
                'int_rate': int_rate,
                'revol_util': revol_util,
                'delinq_2yrs': delinq_2yrs,
                'inq_last_6mths': inq_last_6mths,
                'emp_length': emp_length,
                'open_acc': open_acc,
                'collections_12_mths_ex_med': collections_12_mths_ex_med,
                'loan_amnt': loan_amnt,
                'credit_history_length': credit_history_length,
                'max_bal_bc': max_bal_bc,
                'total_acc': total_acc,
                'open_rv_12m': open_rv_12m,
                'pub_rec': pub_rec,
                'home_ownership': home_ownership
            }
            
            # Make prediction
            with st.spinner('🔄 Analyzing your credit profile...'):
                try:
                    result = predict_application_risk(application_data)
                    
                    if result['success']:
                        # Display results
                        st.success("✅ Credit Score Prediction Complete!")
                        
                        # Results container
                        st.markdown('<div class="result-container">', unsafe_allow_html=True)
                        
                        # Credit Score Display
                        score = result['credit_score']
                        category = result['category']
                        risk_level = result['risk_level']
                        confidence = result['confidence']
                        
                        # Determine color based on risk level
                        if 'High Risk' in risk_level:
                            risk_class = 'risk-high'
                        elif 'Medium Risk' in risk_level:
                            risk_class = 'risk-medium'
                        else:
                            risk_class = 'risk-low'
                        
                        st.markdown(f'<div class="score-display {risk_class}">{score}</div>', unsafe_allow_html=True)
                        
                        # Results in columns
                        res_col1, res_col2, res_col3 = st.columns(3)
                        
                        with res_col1:
                            st.metric("Credit Score", f"{score}/850")
                        
                        with res_col2:
                            st.metric("Category", category)
                        
                        with res_col3:
                            st.metric("Risk Level", risk_level)
                        
                        # Additional information
                        st.markdown("---")
                        st.markdown(f"**Model Confidence:** {confidence}%")
                        
                        # Interpretation
                        st.markdown("### 📈 Score Interpretation")
                        if category == "Poor":
                            st.error("🔴 **Poor Credit (300-579)**: High risk. Consider improving credit before major loans.")
                        elif category == "Fair":
                            st.warning("🟡 **Fair Credit (580-669)**: Below average. Some improvement needed.")
                        elif category == "Good":
                            st.info("🔵 **Good Credit (670-739)**: Above average. Good loan eligibility.")
                        elif category == "Very Good":
                            st.success("🟢 **Very Good Credit (740-799)**: Excellent loan terms available.")
                        else:
                            st.success("🌟 **Exceptional Credit (800-850)**: Best loan terms and rates.")
                        
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                    else:
                        st.error(f"❌ Prediction failed: {result['error']}")
                        if 'validation_errors' in result:
                            st.write("**Validation Errors:**")
                            for error in result['validation_errors']:
                                st.write(f"- {error}")
                
                except Exception as e:
                    st.error(f"❌ An error occurred: {str(e)}")
                    st.write("Please check your inputs and try again.")


if __name__ == "__main__":
    main()