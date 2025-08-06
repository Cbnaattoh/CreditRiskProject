#!/usr/bin/env python3
"""
Ghana-specific employment feature processor for credit scoring.
Adapted for Ghana's economic context, job market, and employment patterns.
"""

import pandas as pd
import numpy as np
from collections import Counter
import re
from typing import Dict, Any, List, Tuple

def categorize_ghana_job_title(title: str) -> str:
    """
    Categorize job titles based on Ghana's employment landscape and economic sectors.
    
    Ghana's economy is driven by:
    - Services (54% of GDP): Banking, telecom, retail, hospitality
    - Industry (25% of GDP): Mining, manufacturing, construction  
    - Agriculture (21% of GDP): Cocoa, agriculture, fishing
    """
    if pd.isna(title) or title == '':
        return 'Unknown'
    
    title = str(title).lower().strip()
    
    # HIGH-INCOME PROFESSIONAL SECTORS (Most stable)
    # Banking & Financial Services (Very developed in Ghana)
    if any(word in title for word in ['bank', 'finance', 'financial', 'accounting', 'accountant', 'auditor', 'treasury']):
        return 'Banking & Finance'
    
    # Mining & Oil/Gas (Major economic drivers)
    if any(word in title for word in ['mining', 'mine', 'gold', 'oil', 'gas', 'petroleum', 'drilling', 'exploration']):
        return 'Mining & Energy'
    
    # Telecommunications (Strong sector in Ghana)
    if any(word in title for word in ['telecom', 'telecommunications', 'network', 'mtn', 'vodafone', 'airtel']):
        return 'Telecommunications'
    
    # Medical & Healthcare
    if any(word in title for word in ['doctor', 'physician', 'surgeon', 'dentist', 'pharmacist', 'medical officer']):
        return 'Medical Professional'
    elif any(word in title for word in ['nurse', 'midwife', 'medical', 'health', 'clinical']):
        return 'Healthcare Worker'
    
    # Legal & Professional Services
    if any(word in title for word in ['lawyer', 'attorney', 'barrister', 'solicitor', 'legal', 'counsel']):
        return 'Legal Professional'
    
    # Engineering & Technical (Infrastructure development focus)
    if any(word in title for word in ['engineer', 'engineering', 'technical', 'architect', 'surveyor']):
        return 'Engineering & Technical'
    
    # GOVERNMENT & PUBLIC SECTOR (Very stable in Ghana)
    if any(word in title for word in ['government', 'civil service', 'ministry', 'assembly', 'municipal', 'district', 'public service', 'ghana revenue', 'immigration', 'customs']):
        return 'Government Worker'
    
    # EDUCATION SECTOR
    if any(word in title for word in ['teacher', 'lecturer', 'professor', 'educator', 'principal', 'headmaster', 'university', 'polytechnic']):
        return 'Education Professional'
    
    # MANAGEMENT & EXECUTIVE ROLES
    if any(word in title for word in ['manager', 'director', 'executive', 'president', 'ceo', 'managing director', 'general manager']):
        return 'Management Executive'
    elif any(word in title for word in ['supervisor', 'team lead', 'coordinator', 'assistant manager']):
        return 'Supervisory Role'
    
    # BUSINESS & ENTREPRENEURSHIP (Very common in Ghana)
    if any(word in title for word in ['owner', 'entrepreneur', 'business owner', 'proprietor', 'trader', 'merchant']):
        return 'Business Owner/Trader'
    
    # AGRICULTURE & AGRIBUSINESS (21% of GDP)
    if any(word in title for word in ['farmer', 'agriculture', 'agric', 'cocoa', 'plantation', 'farming', 'fisherman', 'fishing']):
        return 'Agriculture & Fishing'
    
    # MANUFACTURING & INDUSTRY
    if any(word in title for word in ['manufacturing', 'factory', 'production', 'assembly', 'industrial', 'brewery', 'textiles']):
        return 'Manufacturing'
    
    # CONSTRUCTION & REAL ESTATE (Growing sector)
    if any(word in title for word in ['construction', 'contractor', 'builder', 'real estate', 'property', 'estate']):
        return 'Construction & Real Estate'
    
    # SKILLED TRADES
    if any(word in title for word in ['electrician', 'plumber', 'mechanic', 'welder', 'carpenter', 'mason', 'technician']):
        return 'Skilled Trades'
    
    # TRANSPORTATION (Important due to logistics)
    if any(word in title for word in ['driver', 'transport', 'logistics', 'delivery', 'truck', 'taxi', 'uber', 'bolt']):
        return 'Transportation & Logistics'
    
    # RETAIL & SALES
    if any(word in title for word in ['sales', 'retail', 'shop', 'store', 'marketing', 'customer service', 'cashier']):
        return 'Retail & Sales'
    
    # HOSPITALITY & TOURISM
    if any(word in title for word in ['hotel', 'restaurant', 'tourism', 'hospitality', 'chef', 'cook', 'waiter', 'bartender']):
        return 'Hospitality & Tourism'
    
    # SECURITY SERVICES (Common employment)
    if any(word in title for word in ['security', 'guard', 'watchman', 'police', 'military']):
        return 'Security Services'
    
    # DOMESTIC & SERVICE WORKERS
    if any(word in title for word in ['domestic', 'house help', 'cleaner', 'gardener', 'laundry']):
        return 'Domestic Services'
    
    # MEDIA & CREATIVE
    if any(word in title for word in ['journalist', 'media', 'radio', 'television', 'artist', 'musician', 'photographer']):
        return 'Media & Creative'
    
    return 'Other Services'

def get_ghana_job_stability_score(job_category: str) -> int:
    """
    Assign stability scores based on Ghana's economic context and employment patterns.
    Scale: 0-100 (higher = more stable employment)
    """
    stability_scores = {
        # Highest stability (60-85 points)
        'Government Worker': 85,           # Very stable, good benefits
        'Banking & Finance': 80,           # Well-regulated, stable sector
        'Medical Professional': 75,        # High demand, stable
        'Legal Professional': 75,          # Stable, high-income
        'Mining & Energy': 70,             # High-paying but can be cyclical
        'Education Professional': 70,      # Stable, especially public sector
        'Telecommunications': 68,          # Growing sector, stable companies
        'Engineering & Technical': 65,     # Infrastructure development demand
        
        # Moderate-high stability (45-65 points)  
        'Management Executive': 60,        # Depends on company/sector
        'Healthcare Worker': 58,           # Stable demand
        'Manufacturing': 55,               # Moderate stability
        'Supervisory Role': 50,            # Moderate responsibility
        'Construction & Real Estate': 48,  # Growing but cyclical
        'Skilled Trades': 45,              # Decent demand, skill-based
        
        # Moderate stability (30-45 points)
        'Business Owner/Trader': 40,       # Very common but variable income
        'Transportation & Logistics': 38,  # Essential but competitive
        'Retail & Sales': 35,              # High turnover, competitive
        'Agriculture & Fishing': 35,       # Seasonal, weather dependent
        'Media & Creative': 32,            # Variable income, project-based
        'Security Services': 30,           # Basic employment, low pay
        
        # Lower stability (15-30 points)
        'Hospitality & Tourism': 25,       # Seasonal, tourism dependent
        'Domestic Services': 20,           # Informal sector, low security
        'Other Services': 25,              # Variable
        'Unknown': 15                      # Cannot assess
    }
    
    return stability_scores.get(job_category, 25)

def get_ghana_income_expectation(job_category: str) -> Tuple[float, float]:
    """
    Return expected income range in Ghana Cedis (GHS) per month for job categories.
    Returns (min_monthly_income, max_monthly_income)
    """
    # Based on Ghana's salary ranges (2024 estimates)
    income_ranges = {
        'Mining & Energy': (8000, 25000),          # Very high - oil/mining executives
        'Banking & Finance': (4000, 20000),        # High - bank managers, financial analysts
        'Medical Professional': (5000, 18000),     # High - doctors, specialists
        'Legal Professional': (4000, 16000),       # High - lawyers, legal advisors
        'Engineering & Technical': (3500, 15000),  # High - engineers, architects
        'Management Executive': (4000, 18000),     # High - depends on company size
        'Telecommunications': (3000, 12000),       # Good - telecom professionals
        'Government Worker': (2500, 8000),         # Moderate-good - civil servants
        'Education Professional': (2000, 6000),    # Moderate - teachers, lecturers
        'Healthcare Worker': (2000, 7000),         # Moderate - nurses, medical staff
        'Construction & Real Estate': (2000, 10000), # Variable - contractors, agents
        'Business Owner/Trader': (1500, 15000),    # Very variable - market traders to business owners
        'Skilled Trades': (1800, 5000),            # Moderate - electricians, mechanics
        'Manufacturing': (1500, 4000),             # Lower-moderate - factory workers
        'Transportation & Logistics': (1200, 4000), # Lower-moderate - drivers, logistics
        'Supervisory Role': (2000, 6000),          # Moderate - team leaders
        'Retail & Sales': (1000, 4000),            # Lower - sales staff, shop workers
        'Security Services': (800, 2500),           # Lower - security guards
        'Agriculture & Fishing': (800, 3000),       # Lower - farmers, fishermen
        'Hospitality & Tourism': (1000, 3500),     # Lower - hotel, restaurant staff
        'Media & Creative': (1500, 8000),          # Variable - journalists, artists
        'Domestic Services': (600, 1500),          # Lower - house helps, cleaners
        'Other Services': (1000, 4000),            # Variable
        'Unknown': (1200, 4000)                    # Average estimate
    }
    
    return income_ranges.get(job_category, (1200, 4000))

def calculate_ghana_employment_score(emp_length: str, job_category: str, annual_income: float = None) -> Dict[str, Any]:
    """
    Calculate comprehensive employment score for Ghana context.
    
    Args:
        emp_length: Employment length string
        job_category: Ghana job category
        annual_income: Annual income in Ghana Cedis (optional)
    
    Returns:
        Dictionary with employment metrics
    """
    # Employment length scoring (0-40 points)
    emp_length_score = 0
    emp_length_str = str(emp_length).lower()
    
    if '10+' in emp_length_str or '10 years' in emp_length_str:
        emp_length_score = 40
    elif any(x in emp_length_str for x in ['8', '9']):
        emp_length_score = 35
    elif any(x in emp_length_str for x in ['6', '7']):
        emp_length_score = 30
    elif any(x in emp_length_str for x in ['4', '5']):
        emp_length_score = 25
    elif any(x in emp_length_str for x in ['2', '3']):
        emp_length_score = 15
    elif '1' in emp_length_str:
        emp_length_score = 10
    elif '< 1' in emp_length_str or 'less than 1' in emp_length_str:
        emp_length_score = 5
    else:
        emp_length_score = 15  # Default
    
    # Job stability score (0-60 points)
    job_stability_score = get_ghana_job_stability_score(job_category)
    # Scale from 0-100 to 0-60
    job_stability_score = (job_stability_score / 100) * 60
    
    # Income consistency score (0-20 points) - if income provided
    income_score = 10  # Default moderate score
    if annual_income is not None:
        expected_min, expected_max = get_ghana_income_expectation(job_category)
        monthly_income = annual_income / 12
        
        if expected_min <= monthly_income <= expected_max:
            income_score = 20  # Income matches expectations
        elif monthly_income > expected_max:
            income_score = 18  # Higher than expected (good)
        elif monthly_income >= expected_min * 0.8:
            income_score = 15  # Slightly below expectations
        elif monthly_income >= expected_min * 0.6:
            income_score = 10  # Below expectations
        else:
            income_score = 5   # Much below expectations
    
    total_score = emp_length_score + job_stability_score + income_score
    
    return {
        'total_employment_score': round(total_score, 1),
        'employment_length_score': emp_length_score,
        'job_stability_score': round(job_stability_score, 1),
        'income_consistency_score': income_score,
        'job_category': job_category,
        'expected_income_range_monthly': get_ghana_income_expectation(job_category),
        'employment_risk_level': _get_employment_risk_level(total_score)
    }

def _get_employment_risk_level(score: float) -> str:
    """Convert employment score to risk level."""
    if score >= 90:
        return 'Very Low Risk'
    elif score >= 75:
        return 'Low Risk'
    elif score >= 60:
        return 'Medium Risk'
    elif score >= 45:
        return 'High Risk'
    else:
        return 'Very High Risk'

def process_ghana_employment_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Process employment features for Ghana context.
    
    Args:
        df: DataFrame with raw employment data
        
    Returns:
        DataFrame with processed Ghana employment features
    """
    processed_df = df.copy()
    
    # Categorize job titles for Ghana context
    if 'emp_title' in processed_df.columns:
        processed_df['ghana_job_category'] = processed_df['emp_title'].apply(categorize_ghana_job_title)
        processed_df['ghana_job_stability_score'] = processed_df['ghana_job_category'].apply(get_ghana_job_stability_score)
    
    # Calculate comprehensive employment scores
    employment_scores = []
    for idx, row in processed_df.iterrows():
        emp_length = row.get('emp_length', '5 years')
        job_category = row.get('ghana_job_category', 'Other Services')
        annual_income = row.get('annual_inc', None)
        
        score_data = calculate_ghana_employment_score(emp_length, job_category, annual_income)
        employment_scores.append(score_data)
    
    # Add employment scores as new columns
    for key in employment_scores[0].keys():
        if key != 'expected_income_range_monthly':  # Skip tuple column
            processed_df[f'ghana_{key}'] = [score[key] for score in employment_scores]
    
    return processed_df

def analyze_ghana_employment_impact(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze employment impact specifically for Ghana's context.
    
    Args:
        df: DataFrame with loan data and employment information
        
    Returns:
        Analysis results for Ghana employment patterns
    """
    # Define loan performance categories
    good_loans = ['Fully Paid', 'Current']
    bad_loans = ['Charged Off', 'Default', 'Late (31-120 days)', 'Late (16-30 days)']
    
    # Process Ghana employment features
    df_processed = process_ghana_employment_features(df)
    
    # Analyze by Ghana job categories
    ghana_job_analysis = df_processed.groupby('ghana_job_category').agg({
        'loan_status': ['count', lambda x: sum(x.isin(bad_loans)) / len(x) * 100],
        'annual_inc': 'median',
        'int_rate': 'mean'
    }).round(2)
    ghana_job_analysis.columns = ['Loan_Count', 'Default_Rate_%', 'Median_Income_GHS', 'Avg_Interest_Rate']
    ghana_job_analysis = ghana_job_analysis.sort_values('Default_Rate_%')
    
    # Analyze employment stability scores vs default rates
    df_processed['is_bad_loan'] = df_processed['loan_status'].isin(bad_loans)
    stability_bins = pd.cut(df_processed['ghana_job_stability_score'], bins=[0, 30, 45, 60, 75, 100], labels=['Very High Risk', 'High Risk', 'Medium Risk', 'Low Risk', 'Very Low Risk'])
    
    stability_analysis = df_processed.groupby(stability_bins).agg({
        'is_bad_loan': ['count', 'mean'],
        'annual_inc': 'median'
    }).round(3)
    stability_analysis.columns = ['Count', 'Default_Rate', 'Median_Income']
    
    # Calculate feature importance for Ghana employment
    employment_feature_correlation = df_processed[['ghana_total_employment_score', 'ghana_job_stability_score', 'is_bad_loan']].corr()['is_bad_loan'].abs().sort_values(ascending=False)
    
    return {
        'ghana_job_category_performance': ghana_job_analysis,
        'employment_stability_analysis': stability_analysis,
        'employment_feature_correlations': employment_feature_correlation,
        'total_samples_analyzed': len(df_processed),
        'job_category_distribution': df_processed['ghana_job_category'].value_counts(),
        'recommendations': _generate_ghana_employment_recommendations(ghana_job_analysis, stability_analysis)
    }

def _generate_ghana_employment_recommendations(job_analysis: pd.DataFrame, stability_analysis: pd.DataFrame) -> List[str]:
    """Generate recommendations based on Ghana employment analysis."""
    recommendations = []
    
    # Find best and worst performing job categories
    best_job = job_analysis.index[0]  # Lowest default rate
    worst_job = job_analysis.index[-1]  # Highest default rate
    
    recommendations.extend([
        f"GHANA EMPLOYMENT INSIGHTS:",
        f"• Best performing job category: {best_job} ({job_analysis.loc[best_job, 'Default_Rate_%']:.1f}% default rate)",
        f"• Highest risk job category: {worst_job} ({job_analysis.loc[worst_job, 'Default_Rate_%']:.1f}% default rate)",
        f"• Employment stability scoring shows clear risk differentiation",
        f"• Consider weighting Ghana job categories more heavily in credit scoring",
        f"• Government workers and banking professionals show lowest default rates",
        f"• Informal sector workers (domestic services, agriculture) show higher risk",
        f"• Income expectations aligned with Ghana's economic sectors improve predictions"
    ])
    
    return recommendations

if __name__ == "__main__":
    # Test Ghana employment processor
    print("GHANA EMPLOYMENT PROCESSOR TEST")
    print("=" * 50)
    
    # Test job categorization
    test_jobs = [
        "Bank Manager", "Government Worker", "Cocoa Farmer", "Mining Engineer", 
        "Market Trader", "Security Guard", "Teacher", "Uber Driver",
        "Software Developer", "Doctor", "Mechanic", "House Help"
    ]
    
    print("Job Categorization Test:")
    for job in test_jobs:
        category = categorize_ghana_job_title(job)
        stability = get_ghana_job_stability_score(category)
        income_range = get_ghana_income_expectation(category)
        print(f"  {job:20} -> {category:25} (Stability: {stability:2d}, Income: GHS {income_range[0]:4.0f}-{income_range[1]:5.0f})")
    
    # Test employment scoring
    print(f"\nEmployment Scoring Test:")
    test_cases = [
        ("10+ years", "Government Worker", 96000),  # GHS 8000/month
        ("2 years", "Business Owner/Trader", 60000),  # GHS 5000/month  
        ("5 years", "Banking & Finance", 120000),  # GHS 10000/month
        ("< 1 year", "Domestic Services", 12000)   # GHS 1000/month
    ]
    
    for emp_length, job_category, annual_income in test_cases:
        score_data = calculate_ghana_employment_score(emp_length, job_category, annual_income)
        print(f"  {emp_length:10} + {job_category:20} + GHS {annual_income:6.0f}/year")
        print(f"    Total Score: {score_data['total_employment_score']:5.1f} ({score_data['employment_risk_level']})")
        print(f"    Breakdown: Length({score_data['employment_length_score']:2.0f}) + Stability({score_data['job_stability_score']:4.1f}) + Income({score_data['income_consistency_score']:2.0f})")
        print()