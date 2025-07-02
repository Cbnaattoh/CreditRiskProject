import pandas as pd
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

def clean_emp_length(val):
    """Clean employment length values."""
    if pd.isnull(val):
        return 0
    if val == '10+ years':
        return 10
    if val == '< 1 year':
        return 0.5
    try:
        return float(val.split()[0])
    except:
        return 0

def get_preprocessor(df, features):
    """Define the preprocessor for numerical and categorical features based on available columns."""
    # Debug: Print DataFrame columns to verify
    print("Columns in DataFrame for preprocessor:", df.columns.tolist())
    # Only include home_ownership if it exists in the DataFrame
    categorical_features = ['home_ownership'] if 'home_ownership' in df.columns else []
    numerical_features = [f for f in features if f not in categorical_features]
    
    if not categorical_features:
        print("Warning: No categorical features detected. home_ownership not found.")
    
    transformers = [('num', MinMaxScaler(), numerical_features)]
    if categorical_features:
        transformers.append(('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), categorical_features))
    
    preprocessor = ColumnTransformer(transformers=transformers)
    return preprocessor, categorical_features

def get_feature_names(preprocessor, features, categorical_features):
    """Get feature names after preprocessing."""
    numerical_features = [f for f in features if f not in categorical_features]
    cat_features = (
        preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_features).tolist()
        if categorical_features else []
    )
    return numerical_features + cat_features