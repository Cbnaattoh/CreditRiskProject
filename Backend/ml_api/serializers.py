from rest_framework import serializers
from decimal import Decimal, InvalidOperation

class MLPredictionInputSerializer(serializers.Serializer):
    """
    Serializer for ML model input data
    Accepts all required fields for Ghana employment analysis and credit scoring
    """
    
    # Financial Information (Required)
    annual_income = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, 
                                           help_text="Annual income in Ghana Cedis")
    loan_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1000,
                                         help_text="Requested loan amount in GHS")
    interest_rate = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100,
                                           help_text="Proposed interest rate percentage")
    debt_to_income_ratio = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100,
                                                   help_text="Debt-to-income ratio percentage")
    
    # Credit History Information (Required)
    credit_history_length = serializers.DecimalField(max_digits=4, decimal_places=1, min_value=0, max_value=50,
                                                    help_text="Years of credit history")
    revolving_utilization = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=150,
                                                    help_text="Credit utilization rate percentage", required=False)
    max_bankcard_balance = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0,
                                                   help_text="Maximum balance on bankcards in GHS", required=False)
    
    # Account Information (Required)
    total_accounts = serializers.IntegerField(min_value=0, max_value=100,
                                            help_text="Total number of credit accounts ever")
    open_accounts = serializers.IntegerField(min_value=0, max_value=50,
                                           help_text="Number of currently open accounts", required=False)
    
    # Risk Factors (Optional, default to 0)
    delinquencies_2yr = serializers.IntegerField(min_value=0, max_value=20, default=0,
                                                help_text="Number of delinquencies in past 2 years")
    inquiries_6mo = serializers.IntegerField(min_value=0, max_value=20, default=0,
                                           help_text="Credit inquiries in last 6 months")
    revolving_accounts_12mo = serializers.IntegerField(min_value=0, max_value=20, default=0,
                                                      help_text="New revolving accounts in last 12 months")
    public_records = serializers.IntegerField(min_value=0, max_value=10, default=0,
                                            help_text="Number of public records")
    collections_12mo = serializers.IntegerField(min_value=0, max_value=10, default=0,
                                               help_text="Collections in past 12 months")
    
    # Employment Information (Ghana-specific)
    employment_length = serializers.ChoiceField(
        choices=[
            ('< 1 year', '< 1 year'),
            ('1 year', '1 year'),
            ('2 years', '2 years'),
            ('3 years', '3 years'),
            ('4 years', '4 years'),
            ('5 years', '5 years'),
            ('6 years', '6 years'),
            ('7 years', '7 years'),
            ('8 years', '8 years'),
            ('9 years', '9 years'),
            ('10+ years', '10+ years')
        ],
        help_text="Employment duration at current job"
    )
    
    job_title = serializers.ChoiceField(
        choices=[
            ('Software Engineer', 'Software Engineer'),
            ('Teacher', 'Teacher'),
            ('Nurse', 'Nurse'),
            ('Doctor', 'Doctor'),
            ('Banker', 'Banker'),
            ('Trader', 'Trader'),
            ('Farmer', 'Farmer'),
            ('Driver', 'Driver'),
            ('Mechanic', 'Mechanic'),
            ('Electrician', 'Electrician'),
            ('Accountant', 'Accountant'),
            ('Manager', 'Manager'),
            ('Sales Person', 'Sales Person'),
            ('Secretary', 'Secretary'),
            ('Security Guard', 'Security Guard'),
            ('Government Worker', 'Government Worker'),
            ('Business Owner', 'Business Owner'),
            ('Mining Engineer', 'Mining Engineer'),
            ('Oil Worker', 'Oil Worker'),
            ('Bank Manager', 'Bank Manager'),
            ('Financial Analyst', 'Financial Analyst'),
            ('Pharmacist', 'Pharmacist'),
            ('Lawyer', 'Lawyer'),
            ('Architect', 'Architect'),
            ('Civil Servant', 'Civil Servant'),
            ('Lecturer', 'Lecturer'),
            ('Hotel Worker', 'Hotel Worker'),
            ('Restaurant Worker', 'Restaurant Worker'),
            ('Market Trader', 'Market Trader'),
            ('Shop Owner', 'Shop Owner'),
            ('Cocoa Farmer', 'Cocoa Farmer'),
            ('Fisherman', 'Fisherman'),
            ('House Help', 'House Help'),
            ('Cleaner', 'Cleaner'),
            ('Other', 'Other')
        ],
        help_text="Job title for Ghana employment analysis"
    )
    
    # Housing Information
    home_ownership = serializers.ChoiceField(
        choices=[
            ('OWN', 'Own'),
            ('RENT', 'Rent'),
            ('MORTGAGE', 'Mortgage'),
            ('OTHER', 'Other')
        ],
        help_text="Current housing situation"
    )
    
    def validate(self, attrs):
        """Custom validation for business rules"""
        
        # Validate debt-to-income ratio is reasonable
        annual_income = attrs.get('annual_income', 0)
        loan_amount = attrs.get('loan_amount', 0)
        dti = attrs.get('debt_to_income_ratio', 0)
        
        if annual_income > 0 and dti > 0:
            # Calculate estimated monthly debt payments
            monthly_income = float(annual_income) / 12
            estimated_monthly_debt = (float(dti) / 100) * monthly_income
            
            # Basic sanity check
            if estimated_monthly_debt > monthly_income:
                raise serializers.ValidationError({
                    'debt_to_income_ratio': 'DTI ratio seems too high for the given income'
                })
        
        # Validate loan amount is reasonable for income
        if annual_income > 0 and loan_amount > 0:
            loan_to_income_ratio = float(loan_amount) / float(annual_income)
            if loan_to_income_ratio > 10:  # More than 10x annual income
                raise serializers.ValidationError({
                    'loan_amount': 'Loan amount seems too high relative to annual income'
                })
        
        return attrs


class MLPredictionOutputSerializer(serializers.Serializer):
    """
    Serializer for ML model output data
    Returns all prediction results and analysis
    """
    
    # Prediction Results
    success = serializers.BooleanField(help_text="Whether prediction was successful")
    credit_score = serializers.IntegerField(help_text="Predicted credit score (300-850)", required=False)
    category = serializers.CharField(help_text="Credit score category", required=False)
    risk_level = serializers.CharField(help_text="Risk assessment level", required=False)
    confidence = serializers.FloatField(help_text="Prediction confidence percentage", required=False)
    
    # Ghana Employment Analysis
    ghana_employment_analysis = serializers.DictField(required=False, help_text="Ghana-specific job analysis")
    
    # Model Information
    model_info = serializers.DictField(required=False, help_text="Model metadata and version info")
    
    # Confidence Breakdown
    confidence_factors = serializers.DictField(required=False, help_text="Detailed confidence analysis")
    
    # Processing Information
    processing_time_ms = serializers.IntegerField(required=False, help_text="Processing time in milliseconds")
    prediction_timestamp = serializers.DateTimeField(required=False, help_text="When prediction was made")
    
    # Error Information (if success=False)
    error = serializers.CharField(required=False, help_text="Error message if prediction failed")
    validation_errors = serializers.ListField(required=False, help_text="Field validation errors")


class MLModelHealthSerializer(serializers.Serializer):
    """
    Serializer for ML model health check response
    """
    
    status = serializers.CharField(help_text="Model health status")
    model_loaded = serializers.BooleanField(help_text="Whether model is loaded in memory")
    accuracy = serializers.CharField(help_text="Model accuracy (R² score)")
    features_count = serializers.CharField(help_text="Number of features used")
    ghana_employment_categories = serializers.IntegerField(help_text="Number of Ghana job categories")
    version = serializers.CharField(help_text="Model version")
    last_updated = serializers.DateTimeField(required=False, help_text="When model was last updated")


class BatchPredictionInputSerializer(serializers.Serializer):
    """
    Serializer for batch predictions
    """
    
    predictions = serializers.ListField(
        child=MLPredictionInputSerializer(),
        min_length=1,
        max_length=100,  # Limit batch size
        help_text="List of prediction requests (max 100)"
    )
    
    include_detailed_analysis = serializers.BooleanField(
        default=True,
        help_text="Include detailed confidence analysis in results"
    )


class BatchPredictionOutputSerializer(serializers.Serializer):
    """
    Serializer for batch prediction results
    """
    
    success = serializers.BooleanField(help_text="Whether batch processing was successful")
    total_predictions = serializers.IntegerField(help_text="Total number of predictions requested")
    successful_predictions = serializers.IntegerField(help_text="Number of successful predictions")
    failed_predictions = serializers.IntegerField(help_text="Number of failed predictions")
    
    results = serializers.ListField(
        child=MLPredictionOutputSerializer(),
        help_text="Individual prediction results"
    )
    
    processing_summary = serializers.DictField(
        required=False,
        help_text="Batch processing statistics"
    )
    
    batch_id = serializers.CharField(required=False, help_text="Batch processing identifier")