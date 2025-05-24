from django.conf import settings
from applications.models import CreditApplication
from risk.models import RiskAssessment, RiskFactor
import numpy as np
import pandas as pd
import joblib
from datetime import date

class RiskEngine:
    def __init__(self):
        self.model = joblib.load(settings.RISK_MODEL_PATH)
        self.scaler = joblib.load(settings.SCALER_PATH)
        self.features = settings.RISK_MODEL_FEATURES
        
    def calculate_risk(self, application):
        # Prepare application data for the model
        data = self._prepare_application_data(application)
        
        # Scale features
        scaled_data = self.scaler.transform([data])
        
        # Get prediction
        probability = self.model.predict_proba(scaled_data)[0][1]
        score = self._probability_to_score(probability)
        
        # Create risk assessment
        assessment = RiskAssessment.objects.create(
            application=application,
            risk_score=score,
            probability_of_default=probability,
            expected_loss=self._calculate_expected_loss(application, probability)
        )
        
        # Add risk factors
        self._add_risk_factors(assessment, data)
        
        return assessment
    
    def _prepare_application_data(self, application):
        # Extract all relevant features from the application
        data = {}
        
        # Applicant info
        applicant = application.applicant_info
        data['age'] = self._calculate_age(applicant.date_of_birth)
        data['marital_status'] = applicant.marital_status
        
        # Employment info
        employment = applicant.employment_history.filter(is_current=True).first()
        data['employment_duration'] = self._calculate_employment_duration(employment)
        data['monthly_income'] = float(employment.monthly_income) if employment else 0
        
        # Financial info
        financial = applicant.financial_info
        data['net_worth'] = float(financial.net_worth)
        data['credit_score'] = financial.credit_score or 0
        
        # Application specific
        data['requested_amount'] = float(application.requested_amount)
        data['loan_term'] = application.loan_term
        
        # Ensure all expected features are present
        for feature in self.features:
            if feature not in data:
                data[feature] = 0
                
        # Return as ordered list
        return [data[feature] for feature in self.features]
    
    def _calculate_age(self, dob):
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    
    def _calculate_employment_duration(self, employment):
        if not employment:
            return 0
        duration = (date.today() - employment.start_date).days
        return duration / 365.25  # Return in years
    
    def _probability_to_score(self, probability):
        # Convert probability to a score between 300-850 (like credit scores)
        return 850 - (probability * 550)
    
    def _calculate_expected_loss(self, application, probability):
        # Simplified expected loss calculation
        return float(application.requested_amount) * probability
    
    def _add_risk_factors(self, assessment, data):
        # Get feature importances
        importances = self.model.feature_importances_
        
        # Create risk factors
        for i, feature in enumerate(self.features):
            importance = importances[i]
            value = data[i]
            
            RiskFactor.objects.create(
                assessment=assessment,
                factor_name=feature,
                factor_weight=importance,
                factor_score=self._calculate_factor_score(feature, value),
                notes=f"Raw value: {value}"
            )
    
    def _calculate_factor_score(self, feature, value):
        # Implement feature-specific scoring logic
        if feature == 'credit_score':
            return (value / 850) * 100
        elif feature == 'monthly_income':
            return min(value / 10000 * 100, 100)  # Cap at 100
        # Add more feature-specific calculations
        return 50  # Default score