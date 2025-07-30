"""
Production-ready Credit Risk Prediction API
Optimized for Django integration and high performance.
"""

import os
import sys
from typing import Dict, Union, List, Any
import logging

# Add the ml_model directory to the path for imports
ml_model_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ml_model_dir not in sys.path:
    sys.path.append(ml_model_dir)

from scripts.model_utils import CreditRiskModel, validate_input_data, quick_predict

logger = logging.getLogger(__name__)


class CreditRiskPredictor:
    """
    Production-ready credit risk prediction service.
    Optimized for integration with Django backend.
    """
    
    def __init__(self):
        """Initialize the predictor with lazy loading."""
        self._model = None
    
    @property
    def model(self) -> CreditRiskModel:
        """Lazy load the model when first accessed."""
        if self._model is None:
            self._model = self._load_model()
        return self._model
    
    def _load_model(self) -> CreditRiskModel:
        """Load the credit risk model."""
        try:
            model = CreditRiskModel()
            if not model.load_model():
                raise RuntimeError("Failed to load credit risk model")
            logger.info("Credit risk model loaded successfully")
            return model
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def predict_credit_score(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict credit score from application data.
        
        Args:
            application_data: Dictionary containing application features
            
        Returns:
            Dictionary with prediction results and metadata
        """
        try:
            # Validate input data
            is_valid, errors = validate_input_data(application_data)
            if not is_valid:
                return {
                    'success': False,
                    'error': 'Invalid input data',
                    'validation_errors': errors,
                    'credit_score': None,
                    'category': None,
                    'risk_level': None
                }
            
            # Make prediction
            prediction = self.model.predict_credit_score(application_data)
            
            if 'error' in prediction:
                return {
                    'success': False,
                    'error': prediction['error'],
                    'credit_score': None,
                    'category': None,
                    'risk_level': None
                }
            
            # Return successful prediction
            return {
                'success': True,
                'credit_score': prediction['credit_score'],
                'category': prediction['category'],
                'risk_level': prediction['risk_level'],
                'confidence': prediction['confidence'],
                'model_version': '1.0',
                'prediction_timestamp': None  # Will be set by Django view
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'success': False,
                'error': f'Prediction failed: {str(e)}',
                'credit_score': None,
                'category': None,
                'risk_level': None
            }
    
    def get_feature_importance(self) -> List[Dict[str, Union[str, float]]]:
        """Get feature importance for model interpretability."""
        try:
            return self.model.get_feature_importance()
        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return []
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and performance metrics."""
        try:
            return self.model.get_model_info()
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {}
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on the model."""
        try:
            # Test prediction with sample data
            sample_data = {
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
                'max_bal_bc': 5000,
                'total_acc': 15,
                'open_rv_12m': 2,
                'pub_rec': 0,
                'home_ownership': 'RENT'
            }
            
            result = self.predict_credit_score(sample_data)
            
            return {
                'status': 'healthy' if result['success'] else 'unhealthy',
                'model_loaded': self._model is not None,
                'test_prediction': result['success'],
                'error': result.get('error') if not result['success'] else None
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'model_loaded': False,
                'test_prediction': False,
                'error': str(e)
            }


# Global predictor instance for efficient reuse
_predictor_instance = None


def get_predictor() -> CreditRiskPredictor:
    """Get singleton predictor instance."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = CreditRiskPredictor()
    return _predictor_instance


def predict_application_risk(application_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Quick prediction function for Django integration.
    
    Args:
        application_data: Application data dictionary
        
    Returns:
        Prediction results with metadata
    """
    predictor = get_predictor()
    return predictor.predict_credit_score(application_data)


def get_model_feature_importance() -> List[Dict[str, Union[str, float]]]:
    """Get model feature importance for explainability."""
    predictor = get_predictor()
    return predictor.get_feature_importance()


def get_model_performance_info() -> Dict[str, Any]:
    """Get model performance information."""
    predictor = get_predictor()
    return predictor.get_model_info()


# Example usage and testing
if __name__ == "__main__":
    # Test the prediction system
    sample_application = {
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
        'max_bal_bc': 5000,
        'total_acc': 15,
        'open_rv_12m': 2,
        'pub_rec': 0,
        'home_ownership': 'RENT'
    }
    
    print("Testing Credit Risk Prediction System...")
    print("="*50)
    
    # Test prediction
    result = predict_application_risk(sample_application)
    print("Prediction Result:")
    for key, value in result.items():
        print(f"  {key}: {value}")
    
    print("\n" + "="*50)
    
    # Test health check
    predictor = get_predictor()
    health = predictor.health_check()
    print("Health Check:")
    for key, value in health.items():
        print(f"  {key}: {value}")