import os
import pandas as pd
from utils import clean_emp_length, get_preprocessor, get_feature_names
import pickle

# Load data
df = pd.read_csv('CreditRiskProject/Backend/ml_model/data/raw/dataset.csv')

# Print available columns for debugging
print("Available columns in dataset:", df.columns.tolist())

# Clean emp_length
df['emp_length'] = df['emp_length'].apply(clean_emp_length)

# Derive credit history length
df['earliest_cr_line'] = pd.to_datetime(df['earliest_cr_line'], errors='coerce', format='%b-%Y')
df['credit_history_length'] = (pd.to_datetime('today') - df['earliest_cr_line']).dt.days // 365

# Define features (monetary values in GHC)
features = [
    'annual_inc', 'dti', 'int_rate', 'revol_util', 'delinq_2yrs',
    'inq_last_6mths', 'emp_length', 'open_acc', 'collections_12_mths_ex_med',
    'loan_amnt', 'credit_history_length', 'max_bal_bc', 'total_acc',
    'open_rv_12m', 'pub_rec', 'home_ownership'
]

# Check for missing columns
output_columns = ['id', 'member_id'] + features
missing_cols = [col for col in output_columns if col not in df.columns]
if missing_cols:
    raise ValueError(f"Missing columns in dataset: {missing_cols}")

# Fill missing values with 0 and select relevant columns
df = df[output_columns].fillna(0)

# Get preprocessor after DataFrame modifications
preprocessor, categorical_features = get_preprocessor(df, features)

# Apply preprocessing
X_processed = preprocessor.fit_transform(df[features])

# Convert back to DataFrame
feature_names = get_feature_names(preprocessor, features, categorical_features)
df_scaled = pd.DataFrame(X_processed, columns=feature_names)

# Calculate custom risk score (monetary weights applied to GHC values)
weights = {
    'annual_inc': 2,
    'dti': -3,
    'int_rate': -4,
    'revol_util': -2,
    'delinq_2yrs': -3,
    'inq_last_6mths': -2,
    'emp_length': 1,
    'open_acc': 1,
    'collections_12_mths_ex_med': -2,
    'home_ownership_RENT': 1,
    'home_ownership_OWN': 1,
    'home_ownership_MORTGAGE': 1,
    'home_ownership_NONE': 1,
    'home_ownership_OTHER': 1,
    'loan_amnt': -1,
    'credit_history_length': 2,
    'max_bal_bc': -1,
    'total_acc': 1,
    'open_rv_12m': 1,
    'pub_rec': -3
}

# Only use weights for features that exist in df_scaled
df_scaled['credit_score'] = sum(
    weights[col] * df_scaled[col] for col in feature_names if col in weights
)

# Scale custom score to 300–850
min_score = df_scaled['credit_score'].min()
max_score = df_scaled['credit_score'].max()
df_scaled['credit_score'] = 300 + (df_scaled['credit_score'] - min_score) * (550 / (max_score - min_score))

# Create output directory
output_dir = r'C:\Users\Lenovo-T15p\Desktop\Capstone_project\CreditRiskProject\Backend\ml_model\models'
os.makedirs(output_dir, exist_ok=True)

# Save output, including original features
df_final = pd.concat([df[['id', 'member_id']], df[features], df_scaled[['credit_score']]], axis=1)
output_file_path = f'{output_dir}/credit_score.csv'
df_final.to_csv(output_file_path, index=False)

# Print results
print(df_final.head())
print(f'Output file saved at: {output_file_path}')

# Save preprocessor
with open(r'C:\Users\Lenovo-T15p\Desktop\Capstone_project\CreditRiskProject\Backend\ml_model\models\preprocessor.pkl', 'wb') as f:
    pickle.dump(preprocessor, f)