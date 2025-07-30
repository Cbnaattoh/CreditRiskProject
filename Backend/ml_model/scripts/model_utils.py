"""
Optimized ML Model Utilities for Credit Risk Assessment
Production-ready utilities for model loading, prediction, and feature processing.
"""

import pandas as pd
import numpy as np
import pickle
import os
from typing import Dict, List, Tuple, Optional, Union
from sklearn.preprocessing import StandardScaler


class CreditRiskModel:
    """
    Production-ready Credit Risk Model wrapper with optimized performance.
    Handles model loading, preprocessing, and prediction in a single class.
    """
    
    def __init__(self, model_dir: Optional[str] = None):
        """Initialize the model with optional custom model directory."""
        if model_dir is None:
            # Default to models directory relative to this script
            self.model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        else:
            self.model_dir = model_dir
            
        self.model = None
        self.preprocessor = None
        self.metrics = None
        self.home_ownership_encoding = None
        self.feature_names = None
        
        # Standard feature list for the model (matches saved model)
        self.required_features = [
            'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
            'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
            'loan_amnt', 'credit_history_length', 'max_bal_bc', 'total_acc',
            'open_rv_12m', 'pub_rec', 'home_ownership_encoded', 'debt_amount',
            'estimated_credit_limit', 'loan_to_income_ratio', 'closed_acc',
            'account_utilization', 'high_risk_indicator', 'credit_experience'
        ]
        
    def load_model(self) -> bool:
        """
        Load all model components efficiently.
        Returns True if successful, False otherwise.
        """
        try:
            # Load main model
            model_path = os.path.join(self.model_dir, 'xgboost_credit_score_model.pkl')
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # Load preprocessor
            preprocessor_path = os.path.join(self.model_dir, 'preprocessor.pkl')
            with open(preprocessor_path, 'rb') as f:
                self.preprocessor = pickle.load(f)
            
            # Load metrics
            metrics_path = os.path.join(self.model_dir, 'model_metrics.pkl')
            with open(metrics_path, 'rb') as f:
                self.metrics = pickle.load(f)
            
            # Load home ownership encoding
            encoding_path = os.path.join(self.model_dir, 'home_ownership_encoding.pkl')
            with open(encoding_path, 'rb') as f:
                self.home_ownership_encoding = pickle.load(f)
                
            return True
            
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def clean_emp_length(self, val: Union[str, float, None]) -> float:
        """Clean and normalize employment length values."""
        if pd.isnull(val) or val == '':
            return 0.0
        
        if isinstance(val, (int, float)):
            return float(val)
            
        val_str = str(val).strip().lower()
        
        if val_str == '10+ years':
            return 10.0
        elif val_str == '< 1 year':
            return 0.5
        else:
            try:
                # Extract number from strings like "5 years"
                return float(val_str.split()[0])
            except:
                return 0.0
    
    def preprocess_input(self, data: Dict[str, Union[str, float]]) -> pd.DataFrame:
        """
        Preprocess user input data for model prediction.
        
        Args:
            data: Dictionary with feature values
            
        Returns:
            Preprocessed DataFrame ready for model prediction
        """
        # Create DataFrame from input
        df = pd.DataFrame([data])
        
        # Clean employment length
        if 'emp_length' in df.columns:
            df['emp_length'] = df['emp_length'].apply(self.clean_emp_length)
        
        # Handle home ownership encoding
        if 'home_ownership' in data and self.home_ownership_encoding:
            home_ownership = data['home_ownership'].upper()
            df['home_ownership_encoded'] = self.home_ownership_encoding.get(home_ownership, 0.0)
            df = df.drop('home_ownership', axis=1, errors='ignore')
        elif 'home_ownership_encoded' not in df.columns:
            df['home_ownership_encoded'] = 0.0
        
        # Feature Engineering - Create additional features to match saved model
        
        # Debt amount = loan amount (simple approximation)
        df['debt_amount'] = df.get('loan_amnt', 0) * df.get('dti', 0) / 100
        
        # Estimated credit limit based on income and utilization
        df['estimated_credit_limit'] = df.get('annual_inc', 0) * 0.3  # 30% of annual income
        
        # Loan to income ratio
        df['loan_to_income_ratio'] = df.get('loan_amnt', 0) / np.maximum(df.get('annual_inc', 1), 1)
        
        # Closed accounts (approximate as total_acc - open_acc)
        df['closed_acc'] = np.maximum(df.get('total_acc', 0) - df.get('open_acc', 0), 0)
        
        # Account utilization (same as revol_util)
        df['account_utilization'] = df.get('revol_util', 0)
        
        # High risk indicator (based on delinquencies and DTI)
        df['high_risk_indicator'] = ((df.get('delinq_2yrs', 0) > 0) | (df.get('dti', 0) > 40)).astype(int)
        
        # Credit experience (approximate from credit history length and accounts)
        df['credit_experience'] = (df.get('credit_history_length', 0) * 0.5 + 
                                 df.get('total_acc', 0) * 0.1).fillna(0)
        
        # Ensure all required features are present
        for feature in self.required_features:
            if feature not in df.columns:
                df[feature] = 0.0
        
        # Select only required features in correct order
        df = df[self.required_features]
        
        # Apply preprocessing (StandardScaler)
        if self.preprocessor:
            df_processed = self.preprocessor.transform(df)
            return pd.DataFrame(df_processed, columns=self.required_features)
        
        return df
    
    def predict_credit_score(self, data: Dict[str, Union[str, float]]) -> Dict[str, Union[float, str]]:
        """
        Predict credit score from input data.
        
        Args:
            data: Dictionary with feature values
            
        Returns:
            Dictionary with prediction results
        """
        if not self.model:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        try:
            # Preprocess input
            processed_data = self.preprocess_input(data)
            
            # Make prediction
            score = self.model.predict(processed_data)[0]
            
            # Get score category
            category = self.get_credit_score_category(score)
            
            # Get confidence from model metrics
            confidence = self.metrics.get('r2_score', 0.95) * 100 if self.metrics else 95.0
            
            return {
                'credit_score': round(float(score), 0),
                'category': category,
                'confidence': round(confidence, 2),
                'risk_level': self.get_risk_level(score)
            }
            
        except Exception as e:
            return {
                'error': f"Prediction failed: {str(e)}",
                'credit_score': None,
                'category': None,
                'confidence': None,
                'risk_level': None
            }
    
    def get_credit_score_category(self, score: float) -> str:
        """Map credit score to standard categories."""
        score = int(round(score))
        
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
    
    def get_risk_level(self, score: float) -> str:
        """Determine risk level based on credit score."""
        if score >= 740:
            return "Low Risk"
        elif score >= 670:
            return "Medium Risk"
        elif score >= 580:
            return "High Risk"
        else:
            return "Very High Risk"
    
    def get_feature_importance(self) -> List[Dict[str, Union[str, float]]]:
        """Get feature importance from the model."""
        if not self.model:
            return []
        
        importance = self.model.feature_importances_
        return [
            {
                'feature': feature,
                'importance': float(importance[i]),
                'importance_percent': round(float(importance[i]) * 100, 2)
            }
            for i, feature in enumerate(self.required_features)
        ]
    
    def get_model_info(self) -> Dict[str, Union[str, float, int]]:
        """Get model information and performance metrics."""
        if not self.metrics:
            return {}
        
        return {
            'model_type': 'XGBoost Regressor',
            'r2_score': round(self.metrics.get('r2_score', 0.0), 4),
            'mse': round(self.metrics.get('mse', 0.0), 2),
            'mae': round(self.metrics.get('mae', 0.0), 2),
            'n_features': self.metrics.get('n_features', len(self.required_features)),
            'score_range': '300-850',
            'version': '1.0'
        }


def validate_input_data(data: Dict[str, Union[str, float]]) -> Tuple[bool, List[str]]:
    """
    Validate input data for required fields and value ranges.
    
    Args:
        data: Input data dictionary
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Required fields
    required_fields = [
        'annual_inc', 'dti', 'int_rate', 'revol_util', 
        'emp_length', 'loan_amnt'
    ]
    
    for field in required_fields:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")
    
    # Validate ranges
    if 'annual_inc' in data:
        try:
            annual_inc = float(data['annual_inc'])
            if annual_inc < 0 or annual_inc > 10000000:
                errors.append("Annual income must be between 0 and 10,000,000")
        except (ValueError, TypeError):
            errors.append("Annual income must be a valid number")
    
    if 'dti' in data:
        try:
            dti = float(data['dti'])
            if dti < 0 or dti > 100:
                errors.append("Debt-to-income ratio must be between 0 and 100")
        except (ValueError, TypeError):
            errors.append("DTI must be a valid number")
    
    if 'int_rate' in data:
        try:
            int_rate = float(data['int_rate'])
            if int_rate < 0 or int_rate > 50:
                errors.append("Interest rate must be between 0 and 50")
        except (ValueError, TypeError):
            errors.append("Interest rate must be a valid number")
    
    return len(errors) == 0, errors


# Global model instance for efficient reuse
_model_instance = None

def get_model_instance() -> CreditRiskModel:
    """Get singleton model instance for efficient reuse."""
    global _model_instance
    if _model_instance is None:
        _model_instance = CreditRiskModel()
        if not _model_instance.load_model():
            raise RuntimeError("Failed to load model")
    return _model_instance


def quick_predict(data: Dict[str, Union[str, float]]) -> Dict[str, Union[float, str]]:
    """
    Quick prediction function using singleton model instance.
    
    Args:
        data: Input feature data
        
    Returns:
        Prediction results
    """
    model = get_model_instance()
    return model.predict_credit_score(data)