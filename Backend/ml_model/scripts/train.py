import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import pickle
from utils import get_preprocessor, get_feature_names
import os

# Load preprocessed data
data_path = r'C:\Users\Lenovo-T15p\Desktop\Capstone_project\CreditRiskProject\Backend\ml_model\data\processed\credit_score.csv'
df = pd.read_csv(data_path)

# Load preprocessor
with open(r'C:\Users\Lenovo-T15p\Desktop\Capstone_project\CreditRiskProject\Backend\ml_model\models\preprocessor.pkl', 'rb') as f:
    preprocessor = pickle.load(f)

# Define features and target (monetary values in GHC)
target = 'credit_score'
features = [
    'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
    'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
    'loan_amnt', 'credit_history_length', 'max_bal_bc', 'total_acc',
    'open_rv_12m', 'pub_rec', 'home_ownership'
]
X = df[features].copy()
y = df[target]

# Get categorical features for preprocessor
_, categorical_features = get_preprocessor(df, features)

# Apply preprocessing
X_processed = preprocessor.transform(X)
feature_names = get_feature_names(preprocessor, features, categorical_features)
X = pd.DataFrame(X_processed, columns=feature_names)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train XGBoost model
model = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    random_state=42
)
model.fit(X_train, y_train)

# Evaluate model
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f'Model Training Completed:')
print(f'Mean Squared Error (Test Set): {mse:.2f}')
print(f'R-squared (Test Set Accuracy): {r2:.4f}')

# Save model and metrics
output_dir = r'C:\Users\Lenovo-T15p\Desktop\Capstone_project\CreditRiskProject\Backend\ml_model\models'
os.makedirs(output_dir, exist_ok=True)
model_path = f'{output_dir}/xgboost_credit_score_model.pkl'
metrics_path = f'{output_dir}/model_metrics.pkl'
with open(model_path, 'wb') as model_file:
    pickle.dump(model, model_file)
with open(metrics_path, 'wb') as metrics_file:
    pickle.dump({'r2_score': r2}, metrics_file)
print(f"Model saved as {model_path}")