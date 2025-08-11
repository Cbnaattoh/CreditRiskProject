"""
Credit Scoring Module for RiskGuard System
Production-ready credit score prediction with comprehensive error handling
"""

import pandas as pd
import numpy as np
import pickle
import os
import logging
from typing import Dict, List, Union, Optional, Any, Tuple
from datetime import datetime
import json

# Import validation function from final_preprocessor
try:
    from ..final_preprocessor import validate_single_application
except ImportError:
    import sys
    import os
    parent_dir = os.path.dirname(os.path.dirname(__file__))
    if parent_dir not in sys.path:
        sys.path.append(parent_dir)
    from final_preprocessor import validate_single_application

# Simple DataProcessor replacement class
class DataProcessor:
    """Simple data processor replacement."""
    def __init__(self):
        self.scaler = None
        self.label_encoders = None
        self.home_ownership_encoding = None

logger = logging.getLogger(__name__)


class CreditScorer:
    """
    Production-ready credit scoring system for RiskGuard integration.
    Handles model loading, prediction, and comprehensive error handling.
    """
    
    def __init__(self, model_dir: Optional[str] = None):
        """Initialize credit scorer with model directory."""
        if model_dir is None:
            # Default to models directory relative to this script
            self.model_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 'models'
            )
        else:
            self.model_dir = model_dir
            
        self.model = None
        self.data_processor = DataProcessor()
        self.model_metadata = {}
        self.is_loaded = False
        
        # Model scaling parameters (determined from analysis)
        self.raw_score_min = 488.23  # Minimum raw prediction from model
        self.raw_score_max = 558.98  # Maximum raw prediction from model
        self.scale_factor = 7.77     # Scale factor: (850-300)/(max_raw-min_raw)
        
        # Credit score categories and risk levels (proper 300-850 scale)
        self.score_categories = {
            (300, 579): ("Poor", "Very High Risk"),
            (580, 669): ("Fair", "High Risk"),
            (670, 739): ("Good", "Medium Risk"),
            (740, 799): ("Very Good", "Low Risk"),
            (800, 850): ("Exceptional", "Very Low Risk")
        }
    
    def load_model(self) -> bool:
        """Load all model components and validate integrity."""
        try:
            logger.info(f"Loading model from: {self.model_dir}")
            
            # Load main model - try fixed model first, then fallback to original
            model_path = os.path.join(self.model_dir, 'xgboost_credit_model_fixed.pkl')
            if not os.path.exists(model_path):
                model_path = os.path.join(self.model_dir, 'xgboost_credit_model.pkl')
            if not os.path.exists(model_path):
                model_path = os.path.join(self.model_dir, 'xgboost_credit_score_model.pkl')
            if not os.path.exists(model_path):
                model_path = os.path.join(self.model_dir, 'credit_model.pkl')
            
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # Load preprocessing components - try label encoders first
            encoders_path = os.path.join(self.model_dir, 'label_encoders.pkl')
            if os.path.exists(encoders_path):
                with open(encoders_path, 'rb') as f:
                    self.data_processor.label_encoders = pickle.load(f)
            
            # Fallback to old preprocessor format
            preprocessor_path = os.path.join(self.model_dir, 'preprocessor.pkl')
            if os.path.exists(preprocessor_path):
                with open(preprocessor_path, 'rb') as f:
                    self.data_processor.scaler = pickle.load(f)
            
            # Load home ownership encoding (old format)
            encoding_path = os.path.join(self.model_dir, 'home_ownership_encoding.pkl')
            if os.path.exists(encoding_path):
                with open(encoding_path, 'rb') as f:
                    self.data_processor.home_ownership_encoding = pickle.load(f)
            
            # Load model metadata - try fixed metrics first, then fallback
            metadata_json_path = os.path.join(self.model_dir, 'xgboost_model_metrics_fixed.json')
            if os.path.exists(metadata_json_path):
                with open(metadata_json_path, 'r') as f:
                    self.model_metadata = json.load(f)
            else:
                metadata_json_path = os.path.join(self.model_dir, 'xgboost_model_metrics.json')
                if os.path.exists(metadata_json_path):
                    with open(metadata_json_path, 'r') as f:
                        self.model_metadata = json.load(f)
                else:
                    metadata_path = os.path.join(self.model_dir, 'model_metrics.pkl')
                    if os.path.exists(metadata_path):
                        with open(metadata_path, 'rb') as f:
                            self.model_metadata = pickle.load(f)
            
            # Validate model integrity
            self._validate_model_integrity()
            
            self.is_loaded = True
            logger.info("Model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.is_loaded = False
            return False
    
    def _validate_model_integrity(self) -> None:
        """Validate that all model components are properly loaded."""
        if self.model is None:
            raise ValueError("Main model not loaded")
        
        # For XGBoost model, we just need the model itself and encoders
        # Test with sample data
        sample_data = self._get_sample_data()
        try:
            processed_data = self._preprocess_single_application(sample_data)
            # Extract only the model features (first 16 columns) for validation
            model_features = processed_data.iloc[:, :16]
            _ = self.model.predict(model_features)
            logger.info("Model integrity validation passed")
        except Exception as e:
            raise ValueError(f"Model integrity validation failed: {e}")
    
    def _get_sample_data(self) -> Dict[str, Any]:
        """Get sample data for testing."""
        return {
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
    
    def _preprocess_single_application(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Preprocess a single application for prediction."""
        # Use fixed preprocessing that matches training data format
        try:
            import sys
            import os
            parent_dir = os.path.dirname(os.path.dirname(__file__))
            if parent_dir not in sys.path:
                sys.path.append(parent_dir)
            from final_preprocessor import preprocess_for_prediction_final
            return preprocess_for_prediction_final(data, self.model_dir)
        except Exception as e:
            # Create minimal preprocessing as final fallback
            logger.warning(f"Using minimal preprocessing fallback: {e}")
            
            # Expected 16 features in order
            expected_features = [
                'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
                'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
                'loan_amnt', 'max_bal_bc', 'total_acc', 'open_rv_12m', 
                'pub_rec', 'home_ownership', 'credit_history_length'
            ]
            
            # Create DataFrame with expected features
            processed_data = {}
            for feature in expected_features:
                if feature in data:
                    value = data[feature]
                    if feature == 'emp_length':
                        # Simple employment length conversion
                        if isinstance(value, str):
                            if '10+' in value:
                                processed_data[feature] = 10.0
                            elif '< 1' in value:
                                processed_data[feature] = 0.5
                            else:
                                try:
                                    processed_data[feature] = float(value.split()[0])
                                except:
                                    processed_data[feature] = 5.0
                        else:
                            processed_data[feature] = float(value) if value else 5.0
                    elif feature == 'home_ownership':
                        # Simple home ownership encoding
                        mapping = {'OWN': 1.0, 'MORTGAGE': 2.0, 'RENT': 3.0, 'OTHER': 4.0}
                        processed_data[feature] = mapping.get(str(value).upper(), 3.0)
                    else:
                        processed_data[feature] = float(value) if value is not None else 0.0
                else:
                    # Default values for missing features
                    defaults = {
                        'annual_inc': 50000.0, 'dti': 20.0, 'int_rate': 12.0, 
                        'revol_util': 50.0, 'emp_length': 5.0, 'home_ownership': 3.0
                    }
                    processed_data[feature] = defaults.get(feature, 0.0)
            
            return pd.DataFrame([processed_data])
    
    def predict_credit_score(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict credit score from application data.
        
        Args:
            application_data: Dictionary containing application features
            
        Returns:
            Dictionary with prediction results and metadata
        """
        if not self.is_loaded:
            return self._error_response("Model not loaded. Call load_model() first.")
        
        try:
            # Validate input data
            is_valid, validation_errors = validate_single_application(application_data)
            if not is_valid:
                return self._error_response(
                    "Input validation failed", 
                    validation_errors=validation_errors
                )
            
            # Preprocess data
            processed_data = self._preprocess_single_application(application_data)
            
            # Extract only the model features (first 16 columns) for prediction
            model_features = processed_data.iloc[:, :16]  # First 16 features only
            
            # Make prediction
            raw_prediction = self.model.predict(model_features)[0]
            
            # Scale raw prediction to proper credit score range (300-850)
            credit_score = self._scale_raw_prediction_to_credit_score(raw_prediction)
            
            # Get category and risk level
            category, risk_level = self._get_score_category_and_risk(credit_score)
            
            # Extract Ghana employment analysis from processed data
            ghana_analysis = self._extract_ghana_employment_analysis(application_data, processed_data)
            
            # Calculate comprehensive confidence
            confidence_data = self._calculate_confidence(
                score=credit_score,
                processed_data=processed_data,
                raw_prediction=float(raw_prediction)
            )
            
            return {
                'success': True,
                'credit_score': credit_score,
                'category': category,
                'risk_level': risk_level,
                'confidence': confidence_data['confidence_score'],
                'confidence_level': confidence_data['confidence_level'],
                'confidence_factors': confidence_data['confidence_factors'],
                'confidence_explanation': confidence_data['confidence_explanation'],
                'model_accuracy': confidence_data.get('model_accuracy'),
                'model_metrics': confidence_data.get('model_metrics'),
                'model_version': self.model_metadata.get('training_metadata', {}).get('model_version', '1.0'),
                'prediction_timestamp': datetime.now().isoformat(),
                'raw_prediction': float(raw_prediction),
                'scaling_info': {
                    'raw_score_range': f"{self.raw_score_min:.2f} - {self.raw_score_max:.2f}",
                    'scaled_score_range': "300 - 850",
                    'scale_factor': self.scale_factor
                },
                # Ghana employment analysis results
                'job_category': ghana_analysis.get('job_category', 'N/A'),
                'ghana_job_stability_score': ghana_analysis.get('job_stability_score', 0),
                'ghana_employment_score': ghana_analysis.get('employment_score', 0)
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return self._error_response(f"Prediction failed: {str(e)}")
    
    def _scale_raw_prediction_to_credit_score(self, raw_prediction: float) -> int:
        """
        Scale raw model prediction to proper credit score range (300-850).
        
        Args:
            raw_prediction: Raw prediction from the model (typically 488-559)
            
        Returns:
            Scaled credit score in 300-850 range
        """
        # Apply linear scaling: scaled_score = 300 + (raw_pred - min_raw) * scale_factor
        scaled_score = 300 + (raw_prediction - self.raw_score_min) * self.scale_factor
        
        # Ensure score is within valid range
        credit_score = np.clip(scaled_score, 300, 850)
        
        return int(round(credit_score))
    
    def _get_score_category_and_risk(self, score: int) -> Tuple[str, str]:
        """Get credit score category and risk level."""
        for (min_score, max_score), (category, risk_level) in self.score_categories.items():
            if min_score <= score <= max_score:
                return category, risk_level
        
        return "Invalid Score", "Unknown Risk"
    
    def _calculate_confidence(self, score: int, processed_data: pd.DataFrame = None, raw_prediction: float = None) -> Dict[str, Any]:
        """
        Calculate comprehensive prediction confidence based on multiple factors.
        Enhanced with dynamic accuracy display and Ghana employment features.
        
        Args:
            score: Predicted credit score
            processed_data: Preprocessed input data
            raw_prediction: Raw model prediction before clipping
            
        Returns:
            Dictionary containing confidence score and factors
        """
        # Get model performance metrics - check both nested and direct format
        if 'test_metrics' in self.model_metadata:
            test_metrics = self.model_metadata['test_metrics']
            base_r2 = test_metrics.get('test_r2', test_metrics.get('r2', 0.9839))
            rmse = test_metrics.get('test_rmse', test_metrics.get('rmse', 18.5))
            mae = test_metrics.get('test_mae', test_metrics.get('mae', 14.2))
            training_r2 = test_metrics.get('train_r2', base_r2)
        else:
            # Direct access to metrics in metadata (current format)
            base_r2 = self.model_metadata.get('test_r2', 0.9839)
            # Scale error metrics to match 300-850 scale
            raw_rmse = self.model_metadata.get('test_rmse', 18.5)
            raw_mae = self.model_metadata.get('test_mae', 14.2)
            rmse = raw_rmse * self.scale_factor if isinstance(raw_rmse, (int, float)) else 18.5
            mae = raw_mae * self.scale_factor if isinstance(raw_mae, (int, float)) else 14.2
            training_r2 = self.model_metadata.get('train_r2', base_r2)
        
        model_accuracy_percent = round(base_r2 * 100, 2)
        
        confidence_factors = {}
        
        # 1. Base model performance confidence (35% weight)
        model_confidence = base_r2 * 100
        confidence_factors['model_performance'] = {
            'score': round(model_confidence, 2),
            'weight': 0.35,
            'description': f"Model accuracy: {model_accuracy_percent}% (R² = {base_r2:.4f})",
            'display_accuracy': model_accuracy_percent
        }
        
        # 2. Score range confidence (25% weight)
        score_confidence = self._calculate_score_range_confidence(score)
        confidence_factors['score_range'] = {
            'score': score_confidence,
            'weight': 0.25,
            'description': f"Credit score {score} in typical range"
        }
        
        # 3. Prediction stability confidence (20% weight)
        stability_confidence = self._calculate_prediction_stability(score, raw_prediction, rmse, mae)
        confidence_factors['prediction_stability'] = {
            'score': stability_confidence,
            'weight': 0.20,
            'description': "Based on model prediction error metrics"
        }
        
        # 4. Feature completeness confidence (15% weight)
        feature_confidence = self._calculate_feature_completeness(processed_data)
        confidence_factors['feature_completeness'] = {
            'score': feature_confidence,
            'weight': 0.15,
            'description': "Based on input data quality and completeness"
        }
        
        # 5. Ghana employment feature confidence (15% weight - new)
        ghana_employment_confidence = self._calculate_ghana_employment_confidence(processed_data)
        confidence_factors['ghana_employment'] = {
            'score': ghana_employment_confidence,
            'weight': 0.15,
            'description': "Based on Ghana-specific employment analysis"
        }
        
        # Calculate weighted confidence
        weighted_confidence = sum(
            factor['score'] * factor['weight'] 
            for factor in confidence_factors.values()
        )
        
        # Apply final adjustments and cap at 99.9%
        final_confidence = round(min(weighted_confidence, 99.9), 2)
        
        # Determine confidence level
        confidence_level = self._get_confidence_level(final_confidence)
        
        return {
            'confidence_score': final_confidence,
            'confidence_level': confidence_level,
            'confidence_factors': confidence_factors,
            'confidence_explanation': self._generate_confidence_explanation(final_confidence, confidence_factors),
            'model_accuracy': model_accuracy_percent,
            'model_metrics': {
                'r2_score': base_r2,
                'rmse': rmse,
                'mae': mae,
                'training_r2': training_r2
            }
        }
    
    def _calculate_score_range_confidence(self, score: int) -> float:
        """Calculate confidence based on credit score range."""
        if 580 <= score <= 750:  # Most common range
            return 95.0
        elif 520 <= score <= 580 or 750 <= score <= 800:  # Moderately common
            return 90.0
        elif 450 <= score <= 520 or 800 <= score <= 820:  # Less common
            return 85.0
        elif score < 450 or score > 820:  # Extreme ranges
            return 75.0
        else:
            return 80.0
    
    def _calculate_prediction_stability(self, score: int, raw_prediction: float, rmse: float, mae: float) -> float:
        """Calculate confidence based on prediction stability metrics."""
        if raw_prediction is None:
            return 85.0  # Default if no raw prediction available
        
        # Calculate prediction error bounds
        error_bound = rmse * 2  # 2 standard deviations
        
        # If the clipped score is very different from raw prediction, lower confidence
        prediction_diff = abs(score - raw_prediction)
        
        if prediction_diff <= mae:
            return 95.0  # Very stable prediction
        elif prediction_diff <= error_bound:
            return 85.0
        else:
            return 70.0  # Less stable prediction
    
    def _calculate_feature_completeness(self, processed_data: pd.DataFrame) -> float:
        """Calculate confidence based on feature data quality."""
        if processed_data is None:
            return 80.0  # Default confidence
            
        try:
            # Check for missing or zero values in critical features
            critical_features = ['annual_inc', 'dti', 'int_rate', 'revol_util']
            
            row = processed_data.iloc[0]
            missing_critical = sum(1 for feat in critical_features if feat in row and (pd.isna(row[feat]) or row[feat] == 0))
            
            if missing_critical == 0:
                return 95.0  # All critical features present
            elif missing_critical <= 1:
                return 85.0  # One critical feature missing
            elif missing_critical <= 2:
                return 75.0  # Two critical features missing
            else:
                return 65.0  # Multiple critical features missing
                
        except Exception:
            return 80.0  # Default if analysis fails
    
    def _calculate_ghana_employment_confidence(self, processed_data: pd.DataFrame) -> float:
        """Calculate confidence based on Ghana employment features."""
        if processed_data is None:
            return 75.0  # Default confidence
        
        try:
            row = processed_data.iloc[0]
            
            # Check if Ghana employment features are present
            has_ghana_employment = 'ghana_employment_score' in row
            has_ghana_stability = 'ghana_job_stability_score' in row
            
            if has_ghana_employment and has_ghana_stability:
                # Both Ghana features present - high confidence
                employment_score = row.get('ghana_employment_score', 50.0)
                stability_score = row.get('ghana_job_stability_score', 50.0)
                
                # Higher employment scores indicate better quality data
                if employment_score >= 80 and stability_score >= 70:
                    return 95.0  # Excellent employment profile
                elif employment_score >= 60 and stability_score >= 50:
                    return 85.0  # Good employment profile
                elif employment_score >= 40:
                    return 75.0  # Moderate employment profile
                else:
                    return 65.0  # Lower employment stability
            elif has_ghana_employment or has_ghana_stability:
                # Partial Ghana employment data
                return 80.0
            else:
                # No Ghana employment features - use fallback
                return 70.0
                
        except Exception:
            return 75.0  # Default if analysis fails
    
    def _extract_ghana_employment_analysis(self, application_data: Dict[str, Any], processed_data: pd.DataFrame) -> Dict[str, Any]:
        """Extract Ghana employment analysis results from processed data and application data."""
        try:
            # Import Ghana employment processor
            try:
                from ..ghana_employment_processor import categorize_ghana_job_title, calculate_ghana_employment_score
            except ImportError:
                import sys
                import os
                parent_dir = os.path.dirname(os.path.dirname(__file__))
                if parent_dir not in sys.path:
                    sys.path.append(parent_dir)
                from ghana_employment_processor import categorize_ghana_job_title, calculate_ghana_employment_score
            
            # Get job title from application data
            emp_title = application_data.get('emp_title', 'Other')
            emp_length = application_data.get('emp_length', '5 years')
            annual_income = application_data.get('annual_inc', 50000)
            
            # Categorize job title
            job_category = categorize_ghana_job_title(emp_title)
            
            # Calculate employment score
            employment_analysis = calculate_ghana_employment_score(emp_length, job_category, annual_income)
            
            logger.info(f"🇬🇭 Ghana Analysis: Job='{emp_title}' → Category='{job_category}' → Stability={employment_analysis.get('job_stability_score', 0)}")
            
            return {
                'job_category': job_category,
                'job_stability_score': employment_analysis.get('job_stability_score', 0),
                'employment_score': employment_analysis.get('total_employment_score', 0),
                'employment_risk_level': employment_analysis.get('employment_risk_level', 'Unknown')
            }
            
        except Exception as e:
            logger.error(f"Ghana employment analysis failed: {e}")
            return {
                'job_category': 'N/A',
                'job_stability_score': 0,
                'employment_score': 0,
                'employment_risk_level': 'Unknown'
            }

    def _get_confidence_level(self, confidence_score: float) -> str:
        """Convert confidence score to descriptive level."""
        if confidence_score >= 90:
            return "Very High"
        elif confidence_score >= 80:
            return "High"
        elif confidence_score >= 70:
            return "Medium"
        elif confidence_score >= 60:
            return "Low"
        else:
            return "Very Low"
    
    def _generate_confidence_explanation(self, confidence_score: float, factors: Dict) -> str:
        """Generate human-readable confidence explanation."""
        level = self._get_confidence_level(confidence_score)
        
        # Find the highest contributing factor
        max_contribution = max(factors.values(), key=lambda x: x['score'] * x['weight'])
        
        explanations = {
            "Very High": f"Very high confidence ({confidence_score}%) due to excellent model performance and stable prediction.",
            "High": f"High confidence ({confidence_score}%) with good model reliability. Primary factor: {max_contribution['description']}",
            "Medium": f"Medium confidence ({confidence_score}%). Consider reviewing input data quality for better reliability.",
            "Low": f"Low confidence ({confidence_score}%). Prediction may be less reliable due to data limitations or extreme values.",
            "Very Low": f"Very low confidence ({confidence_score}%). Use this prediction with caution."
        }
        
        return explanations.get(level, f"Confidence: {confidence_score}%")
    
    def _error_response(self, error_message: str, validation_errors: List[str] = None) -> Dict[str, Any]:
        """Generate standardized error response."""
        response = {
            'success': False,
            'error': error_message,
            'credit_score': None,
            'category': None,
            'risk_level': None,
            'confidence': None,
            'confidence_level': None,
            'confidence_factors': None,
            'confidence_explanation': None,
            'prediction_timestamp': datetime.now().isoformat()
        }
        
        if validation_errors:
            response['validation_errors'] = validation_errors
        
        return response
    
    def batch_predict(self, applications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Predict credit scores for multiple applications."""
        results = []
        
        for i, application in enumerate(applications):
            try:
                result = self.predict_credit_score(application)
                result['batch_index'] = i
                results.append(result)
            except Exception as e:
                error_result = self._error_response(f"Batch prediction failed for index {i}: {str(e)}")
                error_result['batch_index'] = i
                results.append(error_result)
        
        return results
    
    def get_feature_importance(self) -> List[Dict[str, Union[str, float]]]:
        """Get feature importance for model interpretability."""
        if not self.is_loaded or 'feature_importance' not in self.model_metadata:
            return []
        
        # Handle different formats of feature importance data
        feature_importance = self.model_metadata['feature_importance']
        
        # Normalize the format to ensure consistency
        normalized_importance = []
        for item in feature_importance:
            # Handle both old format (Feature/Importance) and new format (feature/importance)
            if 'Feature' in item and 'Importance' in item:
                # Old format
                normalized_importance.append({
                    'feature': item['Feature'],
                    'importance': float(item['Importance']),
                    'importance_percent': float(item['Importance']) * 100
                })
            elif 'feature' in item and 'importance' in item:
                # New format
                normalized_importance.append({
                    'feature': item['feature'],
                    'importance': float(item['importance']),
                    'importance_percent': float(item.get('importance_percent', item['importance'] * 100))
                })
        
        return normalized_importance
    
    def get_model_performance(self) -> Dict[str, Any]:
        """Get model performance metrics."""
        if not self.model_metadata:
            return {}
        
        performance = {
            'model_type': 'XGBoost Regressor',
            'version': self.model_metadata.get('model_version', '1.0'),
            'score_range': '300-850'
        }
        
        # Add test metrics if available (check both nested and direct format)
        if 'test_metrics' in self.model_metadata:
            performance.update(self.model_metadata['test_metrics'])
        else:
            # Check for direct metrics in metadata (current format)
            metric_keys = ['test_r2', 'test_rmse', 'test_mae', 'train_r2', 'train_rmse', 'train_mae']
            for key in metric_keys:
                if key in self.model_metadata:
                    raw_value = self.model_metadata[key]
                    # Scale RMSE and MAE to match the 300-850 credit score scale
                    if 'rmse' in key or 'mae' in key:
                        # Scale error metrics by the same factor we use for scores
                        scaled_value = raw_value * self.scale_factor
                        performance[key] = scaled_value
                        # Also store the raw value for reference
                        performance[f'{key}_raw'] = raw_value
                    else:
                        performance[key] = raw_value
        
        # Add training time if available
        if 'training_time' in self.model_metadata:
            performance['training_time'] = self.model_metadata['training_time']
        
        # Add cross-validation metrics if available
        if 'cross_validation' in self.model_metadata:
            performance['cross_validation'] = self.model_metadata['cross_validation']
        
        return performance
    
    def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check."""
        try:
            if not self.is_loaded:
                return {
                    'status': 'unhealthy',
                    'error': 'Model not loaded',
                    'components': {
                        'model': False,
                        'preprocessor': False,
                        'encoding': False
                    }
                }
            
            # Test prediction with sample data
            sample_data = self._get_sample_data()
            result = self.predict_credit_score(sample_data)
            
            return {
                'status': 'healthy' if result['success'] else 'unhealthy',
                'model_loaded': True,
                'components': {
                    'model': self.model is not None,
                    'preprocessor': self.data_processor.scaler is not None,
                    'encoding': bool(self.data_processor.home_ownership_encoding)
                },
                'test_prediction': {
                    'success': result['success'],
                    'score': result.get('credit_score'),
                    'category': result.get('category')
                },
                'model_version': self.model_metadata.get('training_metadata', {}).get('model_version', '1.0'),
                'last_check': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'model_loaded': False,
                'last_check': datetime.now().isoformat()
            }
    
    def explain_prediction(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Provide explanation for a credit score prediction."""
        try:
            # Get prediction
            prediction = self.predict_credit_score(application_data)
            if not prediction['success']:
                return prediction
            
            # Get feature importance
            feature_importance = self.get_feature_importance()
            
            # Analyze key factors
            processed_data = self._preprocess_single_application(application_data)
            feature_values = processed_data.iloc[0].to_dict()
            
            # Identify top contributing factors
            top_factors = []
            for feature_info in feature_importance[:10]:  # Top 10 features
                feature_name = feature_info['feature']
                if feature_name in feature_values:
                    top_factors.append({
                        'feature': feature_name,
                        'value': feature_values[feature_name],
                        'importance': feature_info['importance'],
                        'contribution': 'positive' if feature_values[feature_name] > 0 else 'negative'
                    })
            
            explanation = prediction.copy()
            explanation.update({
                'explanation': {
                    'top_factors': top_factors,
                    'total_features_used': len(feature_values),
                    'model_confidence': prediction['confidence']
                }
            })
            
            return explanation
            
        except Exception as e:
            return self._error_response(f"Explanation failed: {str(e)}")


# Global scorer instance for efficient reuse
_scorer_instance = None


def get_credit_scorer(model_dir: Optional[str] = None) -> CreditScorer:
    """Get singleton credit scorer instance."""
    global _scorer_instance
    if _scorer_instance is None:
        _scorer_instance = CreditScorer(model_dir)
        if not _scorer_instance.load_model():
            raise RuntimeError("Failed to load credit scoring model")
    return _scorer_instance


def predict_credit_score(application_data: Dict[str, Any], model_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Quick prediction function for RiskGuard integration.
    
    Args:
        application_data: Application data dictionary
        model_dir: Optional model directory path
        
    Returns:
        Prediction results with metadata
    """
    scorer = get_credit_scorer(model_dir)
    return scorer.predict_credit_score(application_data)


def batch_predict_credit_scores(applications: List[Dict[str, Any]], model_dir: Optional[str] = None) -> List[Dict[str, Any]]:
    """Batch prediction for multiple applications."""
    scorer = get_credit_scorer(model_dir)
    return scorer.batch_predict(applications)