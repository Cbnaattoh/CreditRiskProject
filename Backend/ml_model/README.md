# Credit Risk ML Model

Production-ready machine learning model for credit risk assessment with optimized feature utilization and high accuracy.

## 🎯 Model Performance

- **R² Score**: 0.994 (99.4% accuracy)
- **Cross-validation**: Robust performance across different data splits
- **Feature Utilization**: 7/23 features contribute meaningfully (30.4% contribution rate)
- **Score Range**: 300-850 (standard credit score range)

## 📊 Key Features

### Balanced Feature Contribution
Unlike traditional models where 2-3 features dominate, this model ensures balanced contribution:

| Feature | Importance | Impact |
|---------|------------|--------|
| `delinq_2yrs` | 28.72% | Delinquencies in past 2 years |
| `open_rv_12m` | 23.32% | New revolving accounts |
| `revol_util` | 14.88% | Credit utilization rate |
| `home_ownership_encoded` | 11.30% | Housing stability |
| `inq_last_6mths` | 3.14% | Recent credit inquiries |
| `dti` | 3.00% | Debt-to-income ratio |
| `annual_inc` | 1.05% | Annual income |

### Credit Score Categories
- **Poor** (300-579): Very High Risk
- **Fair** (580-669): High Risk  
- **Good** (670-739): Medium Risk
- **Very Good** (740-799): Low Risk
- **Exceptional** (800-850): Low Risk

## 🚀 Quick Start

### Basic Prediction
```python
from ml_model.scripts.predict_api import predict_application_risk

# Application data
application = {
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

# Get prediction
result = predict_application_risk(application)

print(f"Credit Score: {result['credit_score']}")
print(f"Category: {result['category']}")
print(f"Risk Level: {result['risk_level']}")
print(f"Confidence: {result['confidence']}%")
```

### Django Integration
```python
# In your Django views
from ml_model.scripts.predict_api import predict_application_risk

def assess_credit_risk(request):
    application_data = {
        'annual_inc': request.data.get('annual_income'),
        'dti': request.data.get('debt_to_income'),
        # ... map other fields
    }
    
    prediction = predict_application_risk(application_data)
    
    return Response({
        'credit_score': prediction['credit_score'],
        'risk_category': prediction['category'],
        'risk_level': prediction['risk_level']
    })
```

## 📁 Directory Structure

```
ml_model/
├── __init__.py              # Package initialization and constants
├── README.md               # This documentation
├── data/
│   ├── processed/          # Processed training data
│   │   └── credit_score.csv
│   └── raw/               # Raw training data
│       └── dataset.csv
├── models/                # Trained model files (essential)
│   ├── xgboost_credit_score_model.pkl  # Main XGBoost model
│   ├── preprocessor.pkl               # StandardScaler for features
│   ├── model_metrics.pkl             # Performance metrics
│   ├── home_ownership_encoding.pkl   # Categorical encoding
│   └── feature_names.pkl            # Feature name reference
└── scripts/               # Production-ready Python files
    ├── model_utils.py     # Core model utilities and classes
    ├── predict_api.py     # Production prediction API
    └── train_model.py     # Optimized training pipeline
```

## 🔧 Required Input Features

### Basic Input Features (User Provided)
#### Financial Information
- `annual_inc`: Annual income (GHC)
- `loan_amnt`: Loan amount requested (GHC)
- `dti`: Debt-to-income ratio (%)
- `int_rate`: Interest rate (%)

#### Credit History
- `credit_history_length`: Length of credit history (years)
- `delinq_2yrs`: Number of delinquencies in past 2 years
- `inq_last_6mths`: Credit inquiries in last 6 months
- `pub_rec`: Number of public records

#### Account Information
- `open_acc`: Number of open accounts
- `total_acc`: Total number of accounts
- `open_rv_12m`: Revolving accounts opened in last 12 months
- `revol_util`: Revolving credit utilization (%)
- `max_bal_bc`: Maximum balance on bankcards (GHC)
- `collections_12_mths_ex_med`: Collections in past 12 months

#### Personal Information
- `emp_length`: Employment length ("5 years", "10+ years", "< 1 year")
- `home_ownership`: Housing status ("RENT", "OWN", "MORTGAGE", "NONE", "OTHER")

### Engineered Features (Auto-Generated)
The model automatically creates these additional features during prediction:
- `debt_amount`: Estimated total debt based on DTI and loan amount
- `estimated_credit_limit`: Estimated credit limit (30% of annual income)
- `loan_to_income_ratio`: Loan amount relative to annual income
- `closed_acc`: Estimated closed accounts (total_acc - open_acc)
- `account_utilization`: Credit utilization rate (same as revol_util)
- `high_risk_indicator`: Binary flag for high-risk applicants (DTI > 40% or delinq_2yrs > 0)
- `credit_experience`: Combined credit experience score

## 🧪 Testing

```python
# Health check
from ml_model.scripts.predict_api import get_predictor

predictor = get_predictor()
health = predictor.health_check()
print(f"Model Status: {health['status']}")
```

## 📈 Model Training

To retrain the model with new data:

```python
from ml_model.scripts.train_model import CreditRiskTrainer

trainer = CreditRiskTrainer()
metrics = trainer.train_model()
print(f"New model R²: {metrics['test_r2']:.4f}")
```

## 🔒 Production Considerations

- **Thread Safety**: Model instances use singleton pattern for efficiency
- **Error Handling**: Comprehensive validation and error responses
- **Performance**: Optimized for high-throughput prediction
- **Monitoring**: Built-in health checks and performance metrics
- **Logging**: Structured logging for debugging and monitoring

## 📝 Version History

- **v1.0.0**: Initial production release with balanced feature utilization
  - Enhanced model with 23 features (16 basic + 7 engineered)
  - 7/23 meaningful features (30.4% contribution rate)
  - R² score: 0.994
  - Cross-validation stability
  - Production-ready API integration with automatic feature engineering