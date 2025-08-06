"""
Credit Risk ML Model Visualization Dashboard
Enhanced Streamlit app with comprehensive model visualization and analysis
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import sys
import os
from typing import Dict, Any, List
from datetime import datetime

# Add the ml_model directory to the path
ml_model_dir = os.path.dirname(os.path.abspath(__file__))
if ml_model_dir not in sys.path:
    sys.path.append(ml_model_dir)

# Import the credit scorer and Ghana employment processor
try:
    from src.credit_scorer import get_credit_scorer
    from ghana_employment_processor import (
        categorize_ghana_job_title, 
        get_ghana_job_stability_score,
        get_ghana_income_expectation,
        calculate_ghana_employment_score
    )
except ImportError as e:
    st.error(f"Error importing modules: {e}")
    st.stop()

# Page configuration
st.set_page_config(
    page_title="Credit Risk ML Model Dashboard",
    page_icon="📊",
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
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 1.5rem;
        margin: 1rem 0;
        border-left: 5px solid #3498db;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .score-display {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        margin: 1rem 0;
    }
    .risk-high { color: #e74c3c; }
    .risk-medium { color: #f39c12; }
    .risk-low { color: #27ae60; }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_sample_data():
    """Load sample data for visualization purposes."""
    np.random.seed(42)
    n_samples = 1000
    
    # Generate realistic sample data
    data = {
        'annual_inc': np.random.lognormal(10.5, 0.8, n_samples) * 1000,
        'dti': np.random.beta(2, 5, n_samples) * 50,
        'int_rate': np.random.gamma(2, 2, n_samples) + 5,
        'revol_util': np.random.beta(2, 3, n_samples) * 100,
        'delinq_2yrs': np.random.poisson(0.5, n_samples),
        'inq_last_6mths': np.random.poisson(1.2, n_samples),
        'open_acc': np.random.poisson(8, n_samples) + 1,
        'total_acc': np.random.poisson(15, n_samples) + 5,
        'credit_history_length': np.random.exponential(8, n_samples) + 1,
    }
    
    # Generate credit scores using a simple formula
    scores = []
    for i in range(n_samples):
        base_score = 650
        base_score += (data['annual_inc'][i] / 100000) * 50
        base_score -= data['dti'][i] * 2
        base_score -= data['int_rate'][i] * 5
        base_score -= data['revol_util'][i] * 1.5
        base_score -= data['delinq_2yrs'][i] * 30
        base_score -= data['inq_last_6mths'][i] * 10
        base_score += (data['credit_history_length'][i] / 20) * 50
        
        # Add some randomness and clip to valid range
        score = np.clip(base_score + np.random.normal(0, 20), 300, 850)
        scores.append(int(score))
    
    data['credit_score'] = scores
    
    # Add categories
    categories = []
    for score in scores:
        if score < 580:
            categories.append("Poor")
        elif score < 670:
            categories.append("Fair")
        elif score < 740:
            categories.append("Good")
        elif score < 800:
            categories.append("Very Good")
        else:
            categories.append("Exceptional")
    
    data['category'] = categories
    
    return pd.DataFrame(data)

def initialize_model():
    """Initialize the credit scoring model."""
    try:
        scorer = get_credit_scorer()
        return scorer
    except Exception as e:
        st.error(f"Failed to initialize model: {e}")
        return None

def get_model_health():
    """Get model health status."""
    try:
        scorer = get_credit_scorer()
        return scorer.health_check()
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

def get_model_performance():
    """Get model performance metrics."""
    try:
        scorer = get_credit_scorer()
        return scorer.get_model_performance()
    except Exception as e:
        return {}

def get_feature_importance():
    """Get feature importance data."""
    try:
        scorer = get_credit_scorer()
        return scorer.get_feature_importance()
    except Exception as e:
        return []

def analyze_ghana_employment_factors(emp_title, emp_length, annual_inc):
    """Analyze Ghana employment factors and return detailed breakdown."""
    # Categorize job title
    job_category = categorize_ghana_job_title(emp_title)
    
    # Get job stability score
    stability_score = get_ghana_job_stability_score(job_category)
    
    # Get expected income range
    expected_min, expected_max = get_ghana_income_expectation(job_category)
    monthly_income = annual_inc / 12
    
    # Calculate comprehensive employment score
    employment_analysis = calculate_ghana_employment_score(emp_length, job_category, annual_inc)
    
    # Income analysis
    income_status = "Appropriate"
    if monthly_income > expected_max:
        income_status = "Above Expected"
    elif monthly_income < expected_min * 0.8:
        income_status = "Below Expected"
    
    return {
        'job_category': job_category,
        'stability_score': stability_score,
        'expected_income_range': (expected_min, expected_max),
        'actual_monthly_income': monthly_income,
        'income_status': income_status,
        'employment_analysis': employment_analysis,
        'sector_info': _get_sector_info(job_category)
    }

def _get_sector_info(job_category):
    """Get sector information for job category."""
    sector_info = {
        'Banking & Finance': {'gdp_contribution': '54%', 'stability': 'Very High', 'growth': 'Stable'},
        'Mining & Energy': {'gdp_contribution': '25%', 'stability': 'High', 'growth': 'Growing'},
        'Government Worker': {'gdp_contribution': 'Public', 'stability': 'Very High', 'growth': 'Stable'},
        'Agriculture & Fishing': {'gdp_contribution': '21%', 'stability': 'Seasonal', 'growth': 'Traditional'},
        'Education Professional': {'gdp_contribution': 'Public', 'stability': 'High', 'growth': 'Stable'},
        'Healthcare Worker': {'gdp_contribution': 'Service', 'stability': 'High', 'growth': 'Growing'},
        'Business Owner/Trader': {'gdp_contribution': 'Informal', 'stability': 'Variable', 'growth': 'Dynamic'},
    }
    return sector_info.get(job_category, {'gdp_contribution': 'Service', 'stability': 'Moderate', 'growth': 'Variable'})

def predict_sample_applications(n_samples=100):
    """Generate predictions for sample applications."""
    try:
        scorer = get_credit_scorer()
        results = []
        
        # Generate sample applications
        for _ in range(n_samples):
            sample_app = {
                'annual_inc': np.random.lognormal(10.5, 0.5) * 1000,
                'dti': np.random.beta(2, 5) * 40,
                'int_rate': np.random.gamma(2, 2) + 6,
                'revol_util': np.random.beta(2, 3) * 80,
                'delinq_2yrs': np.random.poisson(0.3),
                'inq_last_6mths': np.random.poisson(1),
                'emp_length': np.random.choice(['2 years', '5 years', '7 years', '10+ years']),
                'emp_title': np.random.choice(['Software Engineer', 'Teacher', 'Nurse', 'Doctor', 'Banker', 'Trader', 'Farmer', 'Driver', 'Mechanic', 'Electrician', 'Accountant', 'Manager', 'Other']),
                'open_acc': np.random.poisson(8) + 1,
                'collections_12_mths_ex_med': np.random.poisson(0.1),
                'loan_amnt': np.random.lognormal(9.5, 0.5) * 1000,
                'credit_history_length': np.random.exponential(8) + 1,
                'max_bal_bc': np.random.lognormal(8, 0.8) * 100,
                'total_acc': np.random.poisson(15) + 5,
                'open_rv_12m': np.random.poisson(1),
                'pub_rec': np.random.poisson(0.1),
                'home_ownership': np.random.choice(['RENT', 'OWN', 'MORTGAGE'])
            }
            
            result = scorer.predict_credit_score(sample_app)
            if result['success']:
                results.append({
                    'credit_score': result['credit_score'],
                    'category': result['category'],
                    'risk_level': result['risk_level'],
                    'confidence': result['confidence'],
                    **sample_app
                })
        
        return pd.DataFrame(results)
    except Exception as e:
        st.error(f"Error generating predictions: {e}")
        return pd.DataFrame()

def main():
    # Header
    st.markdown('<h1 class="main-header">📊 Credit Risk ML Model Dashboard</h1>', unsafe_allow_html=True)
    st.markdown("**Comprehensive visualization and analysis of the credit scoring model**")
    
    # Sidebar navigation
    with st.sidebar:
        st.header("🎛️ Navigation")
        page = st.selectbox(
            "Select Dashboard Page",
            ["Model Overview", "Interactive Prediction", "Ghana Employment Analysis", 
             "Model Performance", "Feature Analysis", "Data Visualization", "Batch Analysis"]
        )
        
        st.header("ℹ️ Model Info")
        health = get_model_health()
        if health['status'] == 'healthy':
            st.success("✅ Model Status: Healthy")
        else:
            st.error("❌ Model Status: Unhealthy")
        
        performance = get_model_performance()
        if performance:
            st.info(f"""
            **Model Performance:**
            - R² Score: {performance.get('test_r2', 0) * 100:.2f}%
            - RMSE: {performance.get('test_rmse', 0):.1f}
            - MAE: {performance.get('test_mae', 0):.1f}
            """)
    
    # Page routing
    if page == "Model Overview":
        show_model_overview()
    elif page == "Interactive Prediction":
        show_interactive_prediction()
    elif page == "Ghana Employment Analysis":
        show_ghana_employment_analysis()
    elif page == "Model Performance":
        show_model_performance()
    elif page == "Feature Analysis":
        show_feature_analysis()
    elif page == "Data Visualization":
        show_data_visualization()
    elif page == "Batch Analysis":
        show_batch_analysis()

def show_model_overview():
    """Display model overview and summary statistics."""
    st.markdown('<div class="section-header">🎯 Model Overview</div>', unsafe_allow_html=True)
    
    # Model health and status
    health = get_model_health()
    performance = get_model_performance()
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        if health['status'] == 'healthy':
            st.metric("Model Status", "✅ Healthy")
        else:
            st.metric("Model Status", "❌ Unhealthy")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col2:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        accuracy = performance.get('test_r2', 0) * 100
        st.metric("Model Accuracy", f"{accuracy:.2f}%")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col3:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.metric("Score Range", "300-850")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with col4:
        st.markdown('<div class="metric-card">', unsafe_allow_html=True)
        st.metric("Model Type", "XGBoost")
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Model architecture and features
    st.markdown("### 🏗️ Model Architecture")
    
    arch_col1, arch_col2 = st.columns(2)
    
    with arch_col1:
        st.markdown("""
        **Model Details:**
        - **Algorithm**: XGBoost Regressor
        - **Features**: 16 input features
        - **Target**: Credit Score (300-850)
        - **Preprocessing**: StandardScaler + Label Encoding
        - **Ghana Integration**: Employment processor
        """)
    
    with arch_col2:
        st.markdown("""
        **Performance Metrics:**
        - **Training R²**: 99.8%
        - **Test R²**: 98.4%
        - **RMSE**: ~18.5 points
        - **MAE**: ~14.2 points
        - **Cross-validation**: 5-fold
        """)
    
    # Feature importance preview
    st.markdown("### 🎯 Top Features")
    feature_importance = get_feature_importance()
    
    if feature_importance:
        top_features = feature_importance[:8]  # Top 8 features
        
        features_df = pd.DataFrame(top_features)
        
        fig = px.bar(
            features_df,
            x='importance',
            y='feature',
            orientation='h',
            title="Top 8 Most Important Features",
            color='importance',
            color_continuous_scale='Blues'
        )
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

def show_interactive_prediction():
    """Interactive prediction interface."""
    st.markdown('<div class="section-header">🎯 Interactive Credit Score Prediction</div>', unsafe_allow_html=True)
    
    # Create input form
    with st.form("prediction_form"):
        # Financial Information
        st.markdown("### 💰 Financial Information")
        col1, col2 = st.columns(2)
        
        with col1:
            annual_inc = st.number_input("Annual Income (GHC)", min_value=0, value=75000, step=5000)
            loan_amnt = st.number_input("Loan Amount (GHC)", min_value=1000, value=25000, step=1000)
            dti = st.number_input("Debt-to-Income Ratio (%)", min_value=0.0, max_value=100.0, value=15.5, step=0.5)
        
        with col2:
            int_rate = st.number_input("Interest Rate (%)", min_value=0.0, max_value=50.0, value=8.5, step=0.1)
            revol_util = st.number_input("Credit Utilization (%)", min_value=0.0, max_value=100.0, value=30.0, step=1.0)
            max_bal_bc = st.number_input("Max Balance on Bankcards (GHC)", min_value=0, value=5000, step=100)
        
        # Credit History
        st.markdown("### 📊 Credit History")
        col3, col4 = st.columns(2)
        
        with col3:
            credit_history_length = st.number_input("Credit History Length (years)", min_value=0, value=10, step=1)
            delinq_2yrs = st.number_input("Delinquencies (2 years)", min_value=0, value=0, step=1)
            inq_last_6mths = st.number_input("Credit Inquiries (6 months)", min_value=0, value=1, step=1)
        
        with col4:
            pub_rec = st.number_input("Public Records", min_value=0, value=0, step=1)
            collections_12_mths_ex_med = st.number_input("Collections (12 months)", min_value=0, value=0, step=1)
        
        # Account Information
        st.markdown("### 🏦 Account Information")
        col5, col6 = st.columns(2)
        
        with col5:
            open_acc = st.number_input("Open Accounts", min_value=0, value=8, step=1)
            total_acc = st.number_input("Total Accounts", min_value=0, value=15, step=1)
        
        with col6:
            open_rv_12m = st.number_input("New Revolving Accounts (12 months)", min_value=0, value=2, step=1)
        
        # Personal Information
        st.markdown("### 👤 Personal Information")
        col7, col8 = st.columns(2)
        
        with col7:
            emp_length = st.selectbox(
                "Employment Length",
                ["< 1 year", "1 year", "2 years", "3 years", "4 years", 
                 "5 years", "6 years", "7 years", "8 years", "9 years", "10+ years"],
                index=4
            )
            
            emp_title = st.selectbox(
                "Job Title",
                ["Software Engineer", "Teacher", "Nurse", "Doctor", "Banker", "Trader", 
                 "Farmer", "Driver", "Mechanic", "Electrician", "Accountant", "Manager", 
                 "Sales Person", "Secretary", "Security Guard", "Other"],
                index=0,
                help="Your current job title (Ghana employment analysis)"
            )
        
        with col8:
            home_ownership = st.selectbox(
                "Home Ownership",
                ["RENT", "OWN", "MORTGAGE", "OTHER"],
                index=2
            )
        
        # Predict button
        if st.form_submit_button("🎯 Predict Credit Score", type="primary"):
            application_data = {
                'annual_inc': annual_inc,
                'dti': dti,
                'int_rate': int_rate,
                'revol_util': revol_util,
                'delinq_2yrs': delinq_2yrs,
                'inq_last_6mths': inq_last_6mths,
                'emp_length': emp_length,
                'emp_title': emp_title,  # Ghana employment analysis
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
            
            try:
                scorer = get_credit_scorer()
                result = scorer.predict_credit_score(application_data)
                
                if result['success']:
                    # Perform Ghana employment analysis
                    ghana_analysis = analyze_ghana_employment_factors(emp_title, emp_length, annual_inc)
                    
                    # Display prediction results
                    st.success("✅ Prediction Complete!")
                    
                    score = result['credit_score']
                    category = result['category']
                    risk_level = result['risk_level']
                    confidence = result['confidence']
                    
                    # Main score display
                    if 'High Risk' in risk_level:
                        risk_class = 'risk-high'
                    elif 'Medium Risk' in risk_level:
                        risk_class = 'risk-medium'
                    else:
                        risk_class = 'risk-low'
                    
                    st.markdown(f'<div class="score-display {risk_class}">{score}</div>', unsafe_allow_html=True)
                    
                    # Results metrics
                    res_col1, res_col2, res_col3, res_col4 = st.columns(4)
                    
                    with res_col1:
                        st.metric("Credit Score", f"{score}/850")
                    with res_col2:
                        st.metric("Category", category)
                    with res_col3:
                        st.metric("Risk Level", risk_level)
                    with res_col4:
                        st.metric("Confidence", f"{confidence}%")
                    
                    # Enhanced Ghana Employment Analysis
                    st.markdown("### 🇬🇭 Ghana Employment Analysis")
                    
                    emp_col1, emp_col2, emp_col3 = st.columns(3)
                    
                    with emp_col1:
                        st.markdown("**📋 Job Classification**")
                        st.write(f"**Title**: {emp_title}")
                        st.write(f"**Category**: {ghana_analysis['job_category']}")
                        st.write(f"**Stability Score**: {ghana_analysis['stability_score']}/100")
                        st.write(f"**Employment Risk**: {ghana_analysis['employment_analysis']['employment_risk_level']}")
                    
                    with emp_col2:
                        st.markdown("**💰 Income Analysis**")
                        expected_min, expected_max = ghana_analysis['expected_income_range']
                        st.write(f"**Monthly Income**: GHS {ghana_analysis['actual_monthly_income']:,.0f}")
                        st.write(f"**Expected Range**: GHS {expected_min:,.0f} - {expected_max:,.0f}")
                        st.write(f"**Status**: {ghana_analysis['income_status']}")
                        
                        # Income status indicator
                        if ghana_analysis['income_status'] == "Above Expected":
                            st.success("✅ Income above sector average")
                        elif ghana_analysis['income_status'] == "Below Expected":
                            st.warning("⚠️ Income below sector average")
                        else:
                            st.info("ℹ️ Income within expected range")
                    
                    with emp_col3:
                        st.markdown("**🏭 Sector Information**")
                        sector = ghana_analysis['sector_info']
                        st.write(f"**GDP Contribution**: {sector['gdp_contribution']}")
                        st.write(f"**Sector Stability**: {sector['stability']}")
                        st.write(f"**Growth Outlook**: {sector['growth']}")
                    
                    # Employment Score Breakdown
                    st.markdown("### 📊 Employment Score Breakdown")
                    emp_analysis = ghana_analysis['employment_analysis']
                    
                    score_col1, score_col2, score_col3, score_col4 = st.columns(4)
                    
                    with score_col1:
                        st.metric("Employment Length", f"{emp_analysis['employment_length_score']}/40", 
                                 help="Score based on years of employment")
                    with score_col2:
                        st.metric("Job Stability", f"{emp_analysis['job_stability_score']:.1f}/60", 
                                 help="Score based on job category stability in Ghana")
                    with score_col3:
                        st.metric("Income Consistency", f"{emp_analysis['income_consistency_score']}/20", 
                                 help="Score based on income vs sector expectations")
                    with score_col4:
                        st.metric("Total Employment Score", f"{emp_analysis['total_employment_score']}/120", 
                                 help="Combined employment assessment score")
                    
                    # Confidence Factor Analysis
                    if 'confidence_factors' in result:
                        st.markdown("### 🎯 Detailed Confidence Analysis")
                        factors = result['confidence_factors']
                        
                        # Create progress bars for confidence factors
                        for factor_name, factor_data in factors.items():
                            factor_display_name = factor_name.replace('_', ' ').title()
                            
                            # Calculate contribution to overall confidence
                            contribution = factor_data['score'] * factor_data['weight']
                            
                            st.write(f"**{factor_display_name}**")
                            
                            # Progress bar
                            progress_col1, progress_col2 = st.columns([3, 1])
                            with progress_col1:
                                st.progress(factor_data['score'] / 100)
                            with progress_col2:
                                st.write(f"{factor_data['score']:.1f}%")
                            
                            st.write(f"Weight: {factor_data['weight']*100:.0f}% | Contribution: {contribution:.1f} points")
                            st.write(f"📝 {factor_data['description']}")
                            st.write("---")
                        
                        # Overall confidence explanation
                        st.markdown("### 💡 Confidence Summary")
                        total_weighted_score = sum(f['score'] * f['weight'] for f in factors.values())
                        st.write(f"**Overall Confidence**: {confidence}% (Weighted Score: {total_weighted_score:.1f})")
                        
                        if confidence >= 95:
                            st.success("🌟 **Very High Confidence** - Excellent data quality and model reliability")
                        elif confidence >= 85:
                            st.success("✅ **High Confidence** - Good data quality with reliable prediction")
                        elif confidence >= 75:
                            st.info("ℹ️ **Medium Confidence** - Acceptable prediction reliability")
                        elif confidence >= 65:
                            st.warning("⚠️ **Low Confidence** - Some data limitations may affect accuracy")
                        else:
                            st.error("❌ **Very Low Confidence** - Significant data limitations detected")
                
                else:
                    st.error(f"❌ Prediction failed: {result['error']}")
                    
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")

def show_ghana_employment_analysis():
    """Display comprehensive Ghana employment analysis."""
    st.markdown('<div class="section-header">🇬🇭 Ghana Employment Analysis</div>', unsafe_allow_html=True)
    
    st.markdown("""
    This page provides insights into Ghana's employment landscape and how different job categories 
    affect credit scoring based on the country's economic structure.
    """)
    
    # Ghana Economic Overview
    st.markdown("### 🏛️ Ghana Economic Structure")
    
    econ_col1, econ_col2, econ_col3 = st.columns(3)
    
    with econ_col1:
        st.markdown("""
        **🏦 Services Sector (54% GDP)**
        - Banking & Finance
        - Telecommunications  
        - Retail & Trade
        - Government Services
        - Professional Services
        """)
    
    with econ_col2:
        st.markdown("""
        **🏭 Industry Sector (25% GDP)**
        - Mining (Gold, Oil)
        - Manufacturing
        - Construction
        - Energy Production
        - Processing Industries
        """)
    
    with econ_col3:
        st.markdown("""
        **🌾 Agriculture Sector (21% GDP)**
        - Cocoa Production
        - Food Crops
        - Livestock
        - Fishing
        - Forestry
        """)
    
    # Job Categories Analysis
    st.markdown("### 📊 Job Categories & Stability Analysis")
    
    # Create sample data for all job categories
    job_categories = [
        ('Government Worker', 85, (2500, 8000)),
        ('Banking & Finance', 80, (4000, 20000)),
        ('Medical Professional', 75, (5000, 18000)),
        ('Legal Professional', 75, (4000, 16000)),
        ('Mining & Energy', 70, (8000, 25000)),
        ('Education Professional', 70, (2000, 6000)),
        ('Telecommunications', 68, (3000, 12000)),
        ('Engineering & Technical', 65, (3500, 15000)),
        ('Management Executive', 60, (4000, 18000)),
        ('Healthcare Worker', 58, (2000, 7000)),
        ('Manufacturing', 55, (1500, 4000)),
        ('Business Owner/Trader', 40, (1500, 15000)),
        ('Transportation & Logistics', 38, (1200, 4000)),
        ('Retail & Sales', 35, (1000, 4000)),
        ('Agriculture & Fishing', 35, (800, 3000)),
        ('Security Services', 30, (800, 2500)),
        ('Hospitality & Tourism', 25, (1000, 3500)),
        ('Domestic Services', 20, (600, 1500))
    ]
    
    job_df = pd.DataFrame(job_categories, columns=['Job_Category', 'Stability_Score', 'Income_Range'])
    job_df['Min_Income'] = job_df['Income_Range'].apply(lambda x: x[0])
    job_df['Max_Income'] = job_df['Income_Range'].apply(lambda x: x[1])
    job_df['Avg_Income'] = (job_df['Min_Income'] + job_df['Max_Income']) / 2
    
    # Stability vs Income scatter plot
    fig_stability = px.scatter(
        job_df,
        x='Stability_Score',
        y='Avg_Income',
        size='Max_Income',
        hover_name='Job_Category',
        title="Job Stability vs Average Income by Category",
        labels={'Stability_Score': 'Job Stability Score (0-100)', 'Avg_Income': 'Average Monthly Income (GHS)'},
        color='Stability_Score',
        color_continuous_scale='RdYlGn'
    )
    st.plotly_chart(fig_stability, use_container_width=True)
    
    # Income range visualization
    st.markdown("### 💰 Income Ranges by Job Category")
    
    fig_income = go.Figure()
    
    for i, row in job_df.iterrows():
        fig_income.add_trace(go.Scatter(
            x=[row['Min_Income'], row['Max_Income']],
            y=[row['Job_Category'], row['Job_Category']],
            mode='lines+markers',
            name=row['Job_Category'],
            line=dict(width=6),
            showlegend=False
        ))
    
    fig_income.update_layout(
        title="Monthly Income Ranges by Job Category (GHS)",
        xaxis_title="Monthly Income (GHS)",
        yaxis_title="Job Category",
        height=600
    )
    st.plotly_chart(fig_income, use_container_width=True)
    
    # Interactive Job Analysis Tool
    st.markdown("### 🔍 Interactive Job Analysis Tool")
    
    selected_job = st.selectbox(
        "Select a job title to analyze:",
        ["Software Engineer", "Bank Manager", "Government Worker", "Cocoa Farmer", 
         "Market Trader", "Security Guard", "Teacher", "Uber Driver",
         "Doctor", "Mechanic", "House Help", "Mining Engineer"]
    )
    
    if st.button("Analyze Job", type="primary"):
        job_category = categorize_ghana_job_title(selected_job)
        stability_score = get_ghana_job_stability_score(job_category)
        expected_min, expected_max = get_ghana_income_expectation(job_category)
        
        # Display analysis
        analysis_col1, analysis_col2, analysis_col3 = st.columns(3)
        
        with analysis_col1:
            st.markdown("**📋 Classification**")
            st.write(f"**Job Title**: {selected_job}")
            st.write(f"**Category**: {job_category}")
            st.write(f"**Stability Score**: {stability_score}/100")
        
        with analysis_col2:
            st.markdown("**💰 Income Expectations**")
            st.write(f"**Min Monthly**: GHS {expected_min:,.0f}")
            st.write(f"**Max Monthly**: GHS {expected_max:,.0f}")
            st.write(f"**Annual Range**: GHS {expected_min*12:,.0f} - {expected_max*12:,.0f}")
        
        with analysis_col3:
            st.markdown("**📈 Risk Assessment**")
            if stability_score >= 70:
                risk_level = "Low Risk"
                st.success(f"✅ {risk_level}")
            elif stability_score >= 50:
                risk_level = "Medium Risk"
                st.warning(f"⚠️ {risk_level}")
            else:
                risk_level = "High Risk"
                st.error(f"❌ {risk_level}")
            
            sector_info = _get_sector_info(job_category)
            st.write(f"**Sector**: {sector_info['gdp_contribution']}")
            st.write(f"**Growth**: {sector_info['growth']}")
        
        # Employment score simulation
        st.markdown("### 🧮 Employment Score Simulation")
        
        sim_col1, sim_col2 = st.columns(2)
        
        with sim_col1:
            sim_emp_length = st.selectbox("Employment Length:", 
                                        ["< 1 year", "2 years", "5 years", "10+ years"], index=2)
            sim_annual_income = st.number_input("Annual Income (GHS):", 
                                              min_value=0, value=int((expected_min + expected_max) * 6), step=5000)
        
        with sim_col2:
            employment_score = calculate_ghana_employment_score(sim_emp_length, job_category, sim_annual_income)
            
            st.metric("Total Employment Score", f"{employment_score['total_employment_score']}/120")
            st.metric("Employment Risk Level", employment_score['employment_risk_level'])
            
            # Score breakdown
            st.write("**Score Breakdown:**")
            st.write(f"• Length: {employment_score['employment_length_score']}/40")
            st.write(f"• Stability: {employment_score['job_stability_score']:.1f}/60")
            st.write(f"• Income: {employment_score['income_consistency_score']}/20")
    
    # Recommendations
    st.markdown("### 💡 Ghana Employment Insights & Recommendations")
    
    st.info("""
    **Key Insights from Ghana Employment Analysis:**
    
    1. **Government Workers** have the highest job security (85/100 stability score)
    2. **Banking & Finance** offers best combination of stability and income potential  
    3. **Mining & Energy** provides highest income but with cyclical risks
    4. **Agriculture & Fishing** remains important (21% GDP) but income is seasonal
    5. **Business Owners/Traders** show high income variability typical of Ghana's informal economy
    6. **Security Services** and **Domestic Work** represent vulnerable employment categories
    
    **For Credit Scoring:**
    - Weight employment stability heavily for loan approval decisions
    - Consider sector-specific income ranges for realistic assessments
    - Factor in Ghana's three-tier economy (Services, Industry, Agriculture)
    - Account for informal economy prevalence in risk assessment
    """)

def show_model_performance():
    """Display detailed model performance metrics."""
    st.markdown('<div class="section-header">📈 Model Performance Analysis</div>', unsafe_allow_html=True)
    
    performance = get_model_performance()
    health = get_model_health()
    
    if not performance:
        st.warning("No performance data available")
        return
    
    # Performance metrics
    st.markdown("### 🎯 Core Metrics")
    
    perf_col1, perf_col2, perf_col3, perf_col4 = st.columns(4)
    
    with perf_col1:
        test_r2 = performance.get('test_r2', 0)
        st.metric("Test R² Score", f"{test_r2:.4f}", f"{test_r2*100:.2f}%")
    
    with perf_col2:
        test_rmse = performance.get('test_rmse', 0)
        st.metric("Test RMSE", f"{test_rmse:.2f}")
    
    with perf_col3:
        test_mae = performance.get('test_mae', 0)
        st.metric("Test MAE", f"{test_mae:.2f}")
    
    with perf_col4:
        train_r2 = performance.get('train_r2', 0)
        st.metric("Train R² Score", f"{train_r2:.4f}")
    
    # Model health details
    st.markdown("### 🏥 Model Health Check")
    
    if health['status'] == 'healthy':
        st.success("✅ Model is healthy and operational")
        
        health_col1, health_col2 = st.columns(2)
        
        with health_col1:
            st.write("**Component Status:**")
            components = health.get('components', {})
            for component, status in components.items():
                status_icon = "✅" if status else "❌"
                st.write(f"{status_icon} {component.replace('_', ' ').title()}: {'OK' if status else 'Failed'}")
        
        with health_col2:
            if 'test_prediction' in health:
                test_pred = health['test_prediction']
                st.write("**Test Prediction:**")
                st.write(f"Success: {'✅' if test_pred['success'] else '❌'}")
                if test_pred['success']:
                    st.write(f"Score: {test_pred['score']}")
                    st.write(f"Category: {test_pred['category']}")
    else:
        st.error(f"❌ Model is unhealthy: {health.get('error', 'Unknown error')}")

def show_feature_analysis():
    """Display feature importance and analysis."""
    st.markdown('<div class="section-header">🔍 Feature Importance Analysis</div>', unsafe_allow_html=True)
    
    feature_importance = get_feature_importance()
    
    if not feature_importance:
        st.warning("No feature importance data available")
        return
    
    # Feature importance chart
    st.markdown("### 🎯 Feature Importance Rankings")
    
    features_df = pd.DataFrame(feature_importance)
    
    # Horizontal bar chart
    fig = px.bar(
        features_df.head(15),
        x='importance',
        y='feature',
        orientation='h',
        title="Top 15 Most Important Features",
        color='importance',
        color_continuous_scale='Viridis'
    )
    fig.update_layout(height=600)
    st.plotly_chart(fig, use_container_width=True)
    
    # Feature importance table
    st.markdown("### 📋 Detailed Feature Importance")
    
    # Add rank column
    features_df['rank'] = range(1, len(features_df) + 1)
    features_df['importance_percent'] = features_df['importance'] * 100
    
    st.dataframe(
        features_df[['rank', 'feature', 'importance', 'importance_percent']].round(4),
        use_container_width=True
    )

def show_data_visualization():
    """Display various data visualizations."""
    st.markdown('<div class="section-header">📊 Data Visualization & Insights</div>', unsafe_allow_html=True)
    
    # Generate sample predictions
    with st.spinner("Generating sample predictions..."):
        sample_data = predict_sample_applications(200)
    
    if sample_data.empty:
        st.warning("No sample data available for visualization")
        return
    
    # Score distribution by category
    st.markdown("### 🎯 Credit Score Distribution")
    
    fig_box = px.box(
        sample_data,
        x='category',
        y='credit_score',
        color='category',
        title="Credit Score Distribution by Category"
    )
    st.plotly_chart(fig_box, use_container_width=True)
    
    # Risk level analysis
    st.markdown("### ⚠️ Risk Level Analysis")
    
    risk_col1, risk_col2 = st.columns(2)
    
    with risk_col1:
        risk_counts = sample_data['risk_level'].value_counts()
        fig_risk = px.pie(
            values=risk_counts.values,
            names=risk_counts.index,
            title="Risk Level Distribution"
        )
        st.plotly_chart(fig_risk, use_container_width=True)
    
    with risk_col2:
        # Average confidence by risk level
        conf_by_risk = sample_data.groupby('risk_level')['confidence'].mean().reset_index()
        fig_conf_risk = px.bar(
            conf_by_risk,
            x='risk_level',
            y='confidence',
            title="Average Confidence by Risk Level",
            color='confidence',
            color_continuous_scale='Blues'
        )
        st.plotly_chart(fig_conf_risk, use_container_width=True)

def show_batch_analysis():
    """Display batch analysis and bulk prediction capabilities."""
    st.markdown('<div class="section-header">📦 Batch Analysis & Bulk Predictions</div>', unsafe_allow_html=True)
    
    st.markdown("### 🎯 Bulk Prediction Analysis")
    
    # Number of samples selector
    n_samples = st.slider("Number of sample applications to generate", 50, 500, 100, 25)
    
    if st.button("Generate Batch Predictions", type="primary"):
        with st.spinner(f"Generating {n_samples} predictions..."):
            batch_data = predict_sample_applications(n_samples)
        
        if not batch_data.empty:
            st.success(f"✅ Generated {len(batch_data)} predictions successfully!")
            
            # Summary statistics
            st.markdown("### 📊 Batch Summary Statistics")
            
            summary_col1, summary_col2, summary_col3, summary_col4 = st.columns(4)
            
            with summary_col1:
                avg_score = batch_data['credit_score'].mean()
                st.metric("Average Score", f"{avg_score:.0f}")
            
            with summary_col2:
                avg_confidence = batch_data['confidence'].mean()
                st.metric("Average Confidence", f"{avg_confidence:.1f}%")
            
            with summary_col3:
                high_risk_pct = (batch_data['risk_level'].str.contains('High Risk').sum() / len(batch_data)) * 100
                st.metric("High Risk %", f"{high_risk_pct:.1f}%")
            
            with summary_col4:
                excellent_pct = (batch_data['category'] == 'Exceptional').sum() / len(batch_data) * 100
                st.metric("Exceptional %", f"{excellent_pct:.1f}%")
            
            # Category distribution
            st.markdown("### 🏷️ Category Distribution")
            
            category_dist = batch_data['category'].value_counts()
            fig_category = px.bar(
                x=category_dist.index,
                y=category_dist.values,
                title="Credit Score Category Distribution",
                color=category_dist.values,
                color_continuous_scale='Viridis'
            )
            st.plotly_chart(fig_category, use_container_width=True)
            
            # Detailed data table
            st.markdown("### 📋 Detailed Results")
            
            st.dataframe(
                batch_data[['credit_score', 'category', 'risk_level', 'confidence', 
                           'annual_inc', 'dti', 'int_rate', 'revol_util']].round(2),
                use_container_width=True
            )

if __name__ == "__main__":
    main()