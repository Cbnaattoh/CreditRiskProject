from django.conf import settings
from applications.models import CreditApplication
from risk.models import RiskAssessment, RiskFactor, Decision
import numpy as np
import pandas as pd
import joblib
from datetime import date, datetime

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
    

class DecisionEngine:
    def __init__(self):
        self.decision_model = joblib.load(settings.DECISION_MODEL_PATH)
        self.policy_rules = settings.DECISION_POLICY_RULES
    
    def make_decision(self, application):
        risk_assessment = RiskAssessment.objects.get(application=application)
        
        # Get model prediction
        model_decision = self._get_model_decision(application, risk_assessment)
        
        # Apply business rules
        final_decision = self._apply_business_rules(model_decision, application, risk_assessment)
        
        # Create decision record
        decision = Decision.objects.create(
            application=application,
            decision=final_decision['decision'],
            decision_by=None,  # System decision
            amount_approved=final_decision.get('amount_approved'),
            interest_rate=final_decision.get('interest_rate'),
            term_months=final_decision.get('term_months'),
            conditions=final_decision.get('conditions', ''),
            notes='Automated decision'
        )
        
        return decision
    
    def _get_model_decision(self, application, risk_assessment):
        # Prepare features for decision model
        features = self._prepare_features(application, risk_assessment)
        
        # Get model prediction
        prediction = self.decision_model.predict([features])[0]
        proba = self.decision_model.predict_proba([features])[0]
        
        return {
            'prediction': prediction,
            'probability': max(proba),
            'features': features
        }
    
    def _prepare_features(self, application, risk_assessment):
        # Extract relevant features from application and risk assessment
        features = {
            'risk_score': risk_assessment.risk_score,
            'probability_of_default': risk_assessment.probability_of_default,
            'requested_amount': float(application.requested_amount),
            'loan_term': application.loan_term,
            'applicant_income': float(application.applicant_info.employment_history.first().monthly_income),
            'credit_score': application.applicant_info.financial_info.credit_score or 0,
            'debt_to_income': self._calculate_dti(application)
        }
        
        return features
    
    def _calculate_dti(self, application):
        # Calculate debt-to-income ratio
        monthly_income = application.applicant_info.employment_history.first().monthly_income
        monthly_debt = application.applicant_info.financial_info.monthly_expenses
        
        if monthly_income > 0:
            return monthly_debt / monthly_income
        return 0
    
    def _apply_business_rules(self, model_decision, application, risk_assessment):
        # Initial decision from model
        if model_decision['prediction'] == 1 and model_decision['probability'] > 0.7:
            decision = 'APPROVE'
        elif model_decision['prediction'] == 1 and model_decision['probability'] > 0.5:
            decision = 'CONDITIONAL'
        else:
            decision = 'DECLINE'
        
        # Apply amount restrictions based on policy
        requested_amount = float(application.requested_amount)
        approved_amount = requested_amount
        
        if decision == 'APPROVE':
            max_amount = self.policy_rules['max_approval_amount']
            if requested_amount > max_amount:
                approved_amount = max_amount
        
        # Calculate interest rate based on risk
        base_rate = self.policy_rules['base_interest_rate']
        risk_adjustment = (1 - risk_assessment.risk_score / 1000) * 10
        interest_rate = base_rate + risk_adjustment
        
        # Prepare conditions if conditional approval
        conditions = []
        if decision == 'CONDITIONAL':
            conditions.append("Additional documentation required")
            if risk_assessment.risk_score < 400:
                conditions.append("Co-signer required")
        
        return {
            'decision': decision,
            'amount_approved': approved_amount if decision in ['APPROVE', 'CONDITIONAL'] else None,
            'interest_rate': interest_rate if decision in ['APPROVE', 'CONDITIONAL'] else None,
            'term_months': application.loan_term if decision in ['APPROVE', 'CONDITIONAL'] else None,
            'conditions': "\n".join(conditions) if conditions else None
        }