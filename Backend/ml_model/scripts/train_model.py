"""
Optimized Model Training Script for Credit Risk Assessment
Production-ready training pipeline with best practices.
"""

import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import pickle
import os
from typing import Dict, Any, Tuple
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class CreditRiskTrainer:
    """Optimized trainer for credit risk model."""
    
    def __init__(self, data_path: str = None, output_dir: str = None):
        """Initialize trainer with data and output paths."""
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        
        if data_path is None:
            self.data_path = os.path.join(self.script_dir, '..', 'data', 'processed', 'credit_score.csv')
        else:
            self.data_path = data_path
            
        if output_dir is None:
            self.output_dir = os.path.join(self.script_dir, '..', 'models')
        else:
            self.output_dir = output_dir
            
        # Feature configuration
        self.features = [
            'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
            'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
            'loan_amnt', 'credit_history_length', 'max_bal_bc', 'total_acc',
            'open_rv_12m', 'pub_rec', 'home_ownership_encoded'
        ]
        
        self.target = 'credit_score'
        
        # Model configuration
        self.model_params = {
            'objective': 'reg:squarederror',
            'n_estimators': 150,
            'learning_rate': 0.08,
            'max_depth': 4,
            'min_child_weight': 3,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 0.5,
            'random_state': 42,
            'n_jobs': -1
        }
    
    def load_and_prepare_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """Load and prepare training data."""
        logger.info(f"Loading data from {self.data_path}")
        
        try:
            df = pd.read_csv(self.data_path)
            logger.info(f"Data loaded successfully. Shape: {df.shape}")
            
            # Prepare features and target
            X = df[self.features].fillna(0)
            y = df[self.target]
            
            logger.info(f"Features: {len(self.features)}, Samples: {len(X)}")
            return X, y
            
        except FileNotFoundError:
            logger.error(f"Data file not found: {self.data_path}")
            raise
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def train_model(self) -> Dict[str, Any]:
        """Train the credit risk model with optimization."""
        logger.info("Starting model training...")
        
        # Load data
        X, y = self.load_and_prepare_data()
        
        # Preprocessing - StandardScaler for balanced feature contribution
        logger.info("Applying preprocessing...")
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        X_scaled_df = pd.DataFrame(X_scaled, columns=self.features)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled_df, y, test_size=0.2, random_state=42, shuffle=True
        )
        
        logger.info(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
        
        # Train model
        logger.info("Training XGBoost model...")
        model = xgb.XGBRegressor(**self.model_params)
        model.fit(X_train, y_train)
        
        # Evaluate model
        logger.info("Evaluating model performance...")
        metrics = self._evaluate_model(model, X_train, X_test, y_train, y_test, X_scaled_df, y)
        
        # Feature importance analysis
        feature_importance = self._analyze_feature_importance(model)
        metrics['feature_importance'] = feature_importance
        
        # Save model components
        logger.info("Saving model components...")
        self._save_model_components(model, scaler, metrics)
        
        logger.info("Model training completed successfully!")
        return metrics
    
    def _evaluate_model(self, model, X_train, X_test, y_train, y_test, X_full, y_full) -> Dict[str, Any]:
        """Comprehensive model evaluation."""
        # Training predictions
        y_pred_train = model.predict(X_train)
        train_mse = mean_squared_error(y_train, y_pred_train)
        train_r2 = r2_score(y_train, y_pred_train)
        train_mae = mean_absolute_error(y_train, y_pred_train)
        
        # Test predictions
        y_pred_test = model.predict(X_test)
        test_mse = mean_squared_error(y_test, y_pred_test)
        test_r2 = r2_score(y_test, y_pred_test)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        
        # Cross-validation
        logger.info("Performing cross-validation...")
        cv_scores = cross_val_score(model, X_full, y_full, cv=5, scoring='r2')
        
        metrics = {
            'train_mse': train_mse,
            'train_r2': train_r2,
            'train_mae': train_mae,
            'test_mse': test_mse,
            'test_r2': test_r2,
            'test_mae': test_mae,
            'cv_r2_mean': cv_scores.mean(),
            'cv_r2_std': cv_scores.std(),
            'r2_score': test_r2,  # Main metric for compatibility
            'mse': test_mse,
            'mae': test_mae,
            'n_features': len(self.features)
        }
        
        # Log performance
        logger.info(f"Training R²: {train_r2:.4f}")
        logger.info(f"Test R²: {test_r2:.4f}")
        logger.info(f"Cross-validation R²: {cv_scores.mean():.4f} (±{cv_scores.std()*2:.4f})")
        
        return metrics
    
    def _analyze_feature_importance(self, model) -> list:
        """Analyze and log feature importance."""
        importance = model.feature_importances_
        importance_data = []
        
        for i, feature in enumerate(self.features):
            importance_data.append({
                'Feature': feature,
                'Importance': float(importance[i])
            })
        
        # Sort by importance
        importance_data.sort(key=lambda x: x['Importance'], reverse=True)
        
        # Log feature importance
        logger.info("Feature Importance Analysis:")
        meaningful_count = 0
        for i, item in enumerate(importance_data):
            if item['Importance'] >= 0.01:
                meaningful_count += 1
            logger.info(f"  {i+1:2d}. {item['Feature']:25} {item['Importance']:.4f}")
        
        logger.info(f"Meaningful features (>=0.01): {meaningful_count}/{len(self.features)}")
        logger.info(f"Feature contribution rate: {meaningful_count/len(self.features)*100:.1f}%")
        
        return importance_data
    
    def _save_model_components(self, model, preprocessor, metrics):
        """Save all model components."""
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Save main model
        model_path = os.path.join(self.output_dir, 'xgboost_credit_score_model.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        logger.info(f"Model saved: {model_path}")
        
        # Save preprocessor
        preprocessor_path = os.path.join(self.output_dir, 'preprocessor.pkl')
        with open(preprocessor_path, 'wb') as f:
            pickle.dump(preprocessor, f)
        logger.info(f"Preprocessor saved: {preprocessor_path}")
        
        # Save metrics
        metrics_path = os.path.join(self.output_dir, 'model_metrics.pkl')
        with open(metrics_path, 'wb') as f:
            pickle.dump(metrics, f)
        logger.info(f"Metrics saved: {metrics_path}")
        
        # Save feature names for reference
        feature_names_path = os.path.join(self.output_dir, 'feature_names.pkl')
        with open(feature_names_path, 'wb') as f:
            pickle.dump(self.features, f)
        logger.info(f"Feature names saved: {feature_names_path}")


def main():
    """Main training function."""
    try:
        trainer = CreditRiskTrainer()
        metrics = trainer.train_model()
        
        print("\n" + "="*50)
        print("MODEL TRAINING COMPLETED SUCCESSFULLY")
        print("="*50)
        print(f"Final Test R²: {metrics['test_r2']:.4f}")
        print(f"Final Test MSE: {metrics['test_mse']:.2f}")
        print(f"Cross-validation R²: {metrics['cv_r2_mean']:.4f}")
        print(f"Meaningful features: {sum(1 for f in metrics['feature_importance'] if f['Importance'] >= 0.01)}/{len(metrics['feature_importance'])}")
        print("="*50)
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise


if __name__ == "__main__":
    main()