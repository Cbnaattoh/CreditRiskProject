from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .serializers import (
    MLPredictionInputSerializer,
    MLPredictionOutputSerializer,
    MLModelHealthSerializer,
    BatchPredictionInputSerializer,
    BatchPredictionOutputSerializer
)
import sys
import os
import time
import uuid

# Add ML model path to Python path
ml_model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_model')
if ml_model_path not in sys.path:
    sys.path.append(ml_model_path)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_credit_score(request):
    """
    ML Credit Score Prediction API
    
    Takes credit application data and returns ML model prediction
    with Ghana employment analysis.
    
    **Required Fields:**
    - annual_income: Annual income in GHS
    - loan_amount: Requested loan amount
    - interest_rate: Proposed interest rate
    - debt_to_income_ratio: DTI percentage
    - credit_history_length: Years of credit history
    - total_accounts: Total credit accounts
    - employment_length: Employment duration
    - job_title: Job title for Ghana analysis
    - home_ownership: Housing situation
    
    **Returns:**
    - credit_score: Predicted score (300-850)
    - category: Poor, Fair, Good, Very Good, Exceptional
    - risk_level: Risk assessment
    - confidence: Prediction confidence
    - ghana_employment_analysis: Job category and stability
    """
    
    # Validate input data
    input_serializer = MLPredictionInputSerializer(data=request.data)
    if not input_serializer.is_valid():
        return Response({
            'success': False,
            'error': 'Invalid input data',
            'validation_errors': input_serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = input_serializer.validated_data
    start_time = time.time()
    
    try:
        # Import ML model
        try:
            from src.credit_scorer import get_credit_scorer
        except ImportError as e:
            return Response({
                'success': False,
                'error': 'ML model not available',
                'details': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Prepare data for ML model
        ml_data = {
            'annual_inc': float(validated_data['annual_income']),
            'dti': float(validated_data['debt_to_income_ratio']),
            'int_rate': float(validated_data['interest_rate']),
            'revol_util': float(validated_data.get('revolving_utilization', 0)),
            'delinq_2yrs': int(validated_data['delinquencies_2yr']),
            'inq_last_6mths': int(validated_data['inquiries_6mo']),
            'emp_length': validated_data['employment_length'],
            'emp_title': validated_data['job_title'],  # Ghana employment analysis
            'open_acc': int(validated_data.get('open_accounts', 0)),
            'collections_12_mths_ex_med': int(validated_data['collections_12mo']),
            'loan_amnt': float(validated_data['loan_amount']),
            'credit_history_length': float(validated_data['credit_history_length']),
            'max_bal_bc': float(validated_data.get('max_bankcard_balance', 0)),
            'total_acc': int(validated_data['total_accounts']),
            'open_rv_12m': int(validated_data['revolving_accounts_12mo']),
            'pub_rec': int(validated_data['public_records']),
            'home_ownership': validated_data['home_ownership']
        }
        
        # Get ML prediction
        scorer = get_credit_scorer()
        result = scorer.predict_credit_score(ml_data)
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        if result['success']:
            # Prepare successful response
            response_data = {
                'success': True,
                'credit_score': result['credit_score'],
                'category': result['category'],
                'risk_level': result['risk_level'],
                'confidence': result['confidence'],
                'ghana_employment_analysis': {
                    'job_title': validated_data['job_title'],
                    'job_category': result.get('job_category', 'N/A'),
                    'employment_length': validated_data['employment_length'],
                    'stability_score': result.get('employment_score', 'N/A'),
                    'job_stability_score': result.get('job_stability_score', 'N/A'),
                    'income_analysis': result.get('income_analysis', 'N/A')
                },
                'model_info': {
                    'version': result.get('model_version', '2.0.0'),
                    'accuracy': 98.4,
                    'model_type': 'XGBoost',
                    'features_used': len(ml_data),
                    'ghana_categories': 18
                },
                'confidence_factors': result.get('confidence_factors', {}),
                'processing_time_ms': processing_time,
                'prediction_timestamp': timezone.now(),
                'request_id': str(uuid.uuid4())
            }
            
            # Validate output with serializer
            output_serializer = MLPredictionOutputSerializer(data=response_data)
            if output_serializer.is_valid():
                return Response(output_serializer.validated_data, status=status.HTTP_200_OK)
            else:
                # If output validation fails, return raw result
                return Response(response_data, status=status.HTTP_200_OK)
        else:
            # Handle prediction failure
            return Response({
                'success': False,
                'error': result.get('error', 'Prediction failed'),
                'validation_errors': result.get('validation_errors', []),
                'processing_time_ms': processing_time,
                'prediction_timestamp': timezone.now()
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        return Response({
            'success': False,
            'error': f'ML prediction error: {str(e)}',
            'processing_time_ms': processing_time,
            'prediction_timestamp': timezone.now()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_predict_credit_scores(request):
    """
    Batch Credit Score Prediction API
    
    Process multiple credit score predictions in a single request.
    Maximum 100 predictions per batch.
    
    **Input:**
    ```json
    {
        "predictions": [
            {
                "annual_income": 120000,
                "loan_amount": 50000,
                ...
            },
            ...
        ],
        "include_detailed_analysis": true
    }
    ```
    
    **Returns:**
    - Batch processing summary
    - Individual prediction results
    - Success/failure counts
    """
    
    # Validate batch input
    batch_serializer = BatchPredictionInputSerializer(data=request.data)
    if not batch_serializer.is_valid():
        return Response({
            'success': False,
            'error': 'Invalid batch input data',
            'validation_errors': batch_serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    batch_data = batch_serializer.validated_data
    predictions_data = batch_data['predictions']
    include_detailed = batch_data.get('include_detailed_analysis', True)
    
    batch_id = str(uuid.uuid4())
    start_time = time.time()
    
    results = []
    successful_count = 0
    failed_count = 0
    
    try:
        # Import ML model
        from src.credit_scorer import get_credit_scorer
        scorer = get_credit_scorer()
        
        # Process each prediction
        for i, prediction_input in enumerate(predictions_data):
            try:
                # Prepare ML data
                ml_data = {
                    'annual_inc': float(prediction_input['annual_income']),
                    'dti': float(prediction_input['debt_to_income_ratio']),
                    'int_rate': float(prediction_input['interest_rate']),
                    'revol_util': float(prediction_input.get('revolving_utilization', 0)),
                    'delinq_2yrs': int(prediction_input['delinquencies_2yr']),
                    'inq_last_6mths': int(prediction_input['inquiries_6mo']),
                    'emp_length': prediction_input['employment_length'],
                    'emp_title': prediction_input['job_title'],
                    'open_acc': int(prediction_input.get('open_accounts', 0)),
                    'collections_12_mths_ex_med': int(prediction_input['collections_12mo']),
                    'loan_amnt': float(prediction_input['loan_amount']),
                    'credit_history_length': float(prediction_input['credit_history_length']),
                    'max_bal_bc': float(prediction_input.get('max_bankcard_balance', 0)),
                    'total_acc': int(prediction_input['total_accounts']),
                    'open_rv_12m': int(prediction_input['revolving_accounts_12mo']),
                    'pub_rec': int(prediction_input['public_records']),
                    'home_ownership': prediction_input['home_ownership']
                }
                
                # Get prediction
                result = scorer.predict_credit_score(ml_data)
                
                if result['success']:
                    prediction_result = {
                        'success': True,
                        'credit_score': result['credit_score'],
                        'category': result['category'],
                        'risk_level': result['risk_level'],
                        'confidence': result['confidence'],
                        'batch_index': i
                    }
                    
                    if include_detailed:
                        prediction_result.update({
                            'ghana_employment_analysis': {
                                'job_title': prediction_input['job_title'],
                                'job_category': result.get('job_category', 'N/A'),
                                'employment_length': prediction_input['employment_length']
                            },
                            'confidence_factors': result.get('confidence_factors', {})
                        })
                    
                    results.append(prediction_result)
                    successful_count += 1
                else:
                    results.append({
                        'success': False,
                        'error': result.get('error', 'Prediction failed'),
                        'batch_index': i
                    })
                    failed_count += 1
                    
            except Exception as e:
                results.append({
                    'success': False,
                    'error': f'Individual prediction error: {str(e)}',
                    'batch_index': i
                })
                failed_count += 1
        
        # Calculate processing summary
        processing_time = int((time.time() - start_time) * 1000)
        
        batch_response = {
            'success': True,
            'total_predictions': len(predictions_data),
            'successful_predictions': successful_count,
            'failed_predictions': failed_count,
            'results': results,
            'processing_summary': {
                'batch_id': batch_id,
                'processing_time_ms': processing_time,
                'average_time_per_prediction': processing_time / len(predictions_data) if predictions_data else 0,
                'success_rate': (successful_count / len(predictions_data) * 100) if predictions_data else 0
            },
            'batch_id': batch_id
        }
        
        return Response(batch_response, status=status.HTTP_200_OK)
        
    except ImportError:
        return Response({
            'success': False,
            'error': 'ML model not available',
            'batch_id': batch_id
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Batch processing error: {str(e)}',
            'batch_id': batch_id,
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def model_health_check(request):
    """
    ML Model Health Check API
    
    Returns current status and metadata of the ML model.
    
    **Returns:**
    - Model status (healthy/error/unavailable)
    - Model loading status
    - Accuracy information
    - Feature count
    - Ghana employment categories
    - Version information
    """
    
    try:
        from src.credit_scorer import get_credit_scorer
        
        scorer = get_credit_scorer()
        health = scorer.health_check()
        
        health_data = {
            'status': health['status'],
            'model_loaded': health['model_loaded'],
            'accuracy': health.get('accuracy', '98.4% (R² = 0.984)'),
            'features_count': health.get('features_count', '16 core features'),
            'ghana_employment_categories': 18,
            'version': '2.0.0',
            'last_updated': timezone.now(),
            'model_type': 'XGBoost Regressor',
            'training_data': 'Ghana credit dataset',
            'supported_predictions': [
                'Credit score (300-850)',
                'Risk category assessment',
                'Ghana employment analysis',
                'Confidence scoring'
            ]
        }
        
        # Validate with serializer
        health_serializer = MLModelHealthSerializer(data=health_data)
        if health_serializer.is_valid():
            return Response(health_serializer.validated_data, status=status.HTTP_200_OK)
        else:
            return Response(health_data, status=status.HTTP_200_OK)
        
    except ImportError:
        return Response({
            'status': 'unavailable',
            'model_loaded': False,
            'error': 'ML model not installed or accessible',
            'version': 'N/A',
            'last_updated': timezone.now()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({
            'status': 'error',
            'model_loaded': False,
            'error': str(e),
            'version': 'N/A',
            'last_updated': timezone.now()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([])  # Public endpoint - no authentication required
def model_documentation(request):
    """
    ML Model API Documentation
    
    Returns comprehensive API documentation and field descriptions.
    Public endpoint - no authentication required.
    """
    
    documentation = {
        'api_version': '2.0.0',
        'model_info': {
            'name': 'RiskGuard ML Credit Scorer',
            'version': '2.0.0',
            'type': 'XGBoost Regressor',
            'accuracy': '98.4% (R² = 0.984)',
            'specialization': 'Ghana employment analysis'
        },
        'endpoints': {
            'POST /api/ml/predict/': {
                'description': 'Single credit score prediction',
                'authentication': 'Required',
                'rate_limit': '100 requests/minute',
                'max_request_size': '10KB'
            },
            'POST /api/ml/batch-predict/': {
                'description': 'Batch predictions (max 100)',
                'authentication': 'Required', 
                'rate_limit': '10 requests/minute',
                'max_request_size': '1MB'
            },
            'GET /api/ml/health/': {
                'description': 'Model health status',
                'authentication': 'Required',
                'rate_limit': '1000 requests/minute'
            },
            'GET /api/ml/docs/': {
                'description': 'API documentation',
                'authentication': 'None',
                'rate_limit': 'Unlimited'
            }
        },
        'required_fields': {
            'annual_income': 'Annual income in Ghana Cedis (min: 0)',
            'loan_amount': 'Requested loan amount in GHS (min: 1000)',
            'interest_rate': 'Interest rate percentage (0-100)',
            'debt_to_income_ratio': 'DTI ratio percentage (0-100)',
            'credit_history_length': 'Years of credit history (0-50)',
            'total_accounts': 'Total credit accounts (0-100)',
            'employment_length': 'Employment duration (< 1 year to 10+ years)',
            'job_title': 'Job title for Ghana employment analysis',
            'home_ownership': 'Housing status (OWN, RENT, MORTGAGE, OTHER)'
        },
        'optional_fields': {
            'revolving_utilization': 'Credit utilization rate (0-150%)',
            'max_bankcard_balance': 'Maximum bankcard balance in GHS',
            'open_accounts': 'Number of open accounts (0-50)',
            'delinquencies_2yr': 'Delinquencies in past 2 years (default: 0)',
            'inquiries_6mo': 'Credit inquiries in 6 months (default: 0)',
            'revolving_accounts_12mo': 'New revolving accounts (default: 0)',
            'public_records': 'Public records count (default: 0)',
            'collections_12mo': 'Collections in 12 months (default: 0)'
        },
        'ghana_job_categories': [
            'Government Worker (Stability: 85/100)',
            'Banking & Finance (Stability: 80/100)',
            'Medical Professional (Stability: 75/100)',
            'Mining & Energy (Stability: 70/100)',
            'Engineering & Technical (Stability: 65/100)',
            'Education & Teaching (Stability: 60/100)',
            'Legal & Professional Services (Stability: 55/100)',
            'Business Owner/Trader (Stability: 40/100)',
            'Agriculture & Fishing (Stability: 35/100)',
            'Domestic Services (Stability: 20/100)'
        ],
        'response_format': {
            'credit_score': 'Predicted score (300-850)',
            'category': 'Poor | Fair | Good | Very Good | Exceptional',
            'risk_level': 'Very High | High | Medium | Low Risk',
            'confidence': 'Prediction confidence (0-100%)',
            'ghana_employment_analysis': {
                'job_category': 'Categorized job type',
                'stability_score': 'Employment stability (20-85/100)'
            }
        },
        'example_request': {
            'annual_income': 120000,
            'loan_amount': 50000,
            'interest_rate': 12.5,
            'debt_to_income_ratio': 25,
            'credit_history_length': 5,
            'total_accounts': 8,
            'employment_length': '5 years',
            'job_title': 'Software Engineer',
            'home_ownership': 'RENT'
        },
        'example_response': {
            'success': True,
            'credit_score': 694,
            'category': 'Good',
            'risk_level': 'Medium Risk',
            'confidence': 99.19,
            'ghana_employment_analysis': {
                'job_title': 'Software Engineer',
                'job_category': 'Engineering & Technical',
                'stability_score': 65
            }
        }
    }
    
    return Response(documentation, status=status.HTTP_200_OK)
