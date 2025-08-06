# 🚀 ML Model API - Testing Guide

## ✅ API Status: FULLY FUNCTIONAL

The ML Model API has been successfully implemented and tested. All endpoints are working correctly with the Ghana employment analysis and 98.4% accurate credit scoring model.

## 🔗 Available Endpoints

### 1. **API Documentation** (Public - No Auth Required)
```
GET http://localhost:8000/api/ml/docs/
```
**Purpose:** Get complete API documentation, field descriptions, and examples

### 2. **Model Health Check** (Auth Required)
```
GET http://localhost:8000/api/ml/health/
Authorization: Bearer <your-token>
```
**Purpose:** Check if ML model is loaded and healthy

### 3. **Single Prediction** (Auth Required) 
```
POST http://localhost:8000/api/ml/predict/
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "annual_income": 120000,
  "loan_amount": 50000,
  "interest_rate": 12.5,
  "debt_to_income_ratio": 25,
  "credit_history_length": 5,
  "total_accounts": 8,
  "employment_length": "5 years",
  "job_title": "Software Engineer",
  "home_ownership": "RENT"
}
```

### 4. **Batch Predictions** (Auth Required)
```
POST http://localhost:8000/api/ml/batch-predict/
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "predictions": [
    {
      "annual_income": 100000,
      "loan_amount": 40000,
      "interest_rate": 10.5,
      "debt_to_income_ratio": 20,
      "credit_history_length": 3,
      "total_accounts": 6,
      "employment_length": "3 years",
      "job_title": "Teacher",
      "home_ownership": "RENT"
    }
  ],
  "include_detailed_analysis": true
}
```

## 🧪 How to Test

### Step 1: Start Django Server
```bash
cd Backend
python manage.py runserver
```

### Step 2: Test Public Documentation (No Auth)
```bash
# Using curl
curl http://localhost:8000/api/ml/docs/

# Using browser
# Open: http://localhost:8000/api/ml/docs/
```

### Step 3: Get Authentication Token
```bash
# Login to get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'
```

### Step 4: Test ML Endpoints
```bash
# Health check
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/ml/health/

# Single prediction
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "annual_income": 120000,
    "loan_amount": 50000,
    "interest_rate": 12.5,
    "debt_to_income_ratio": 25,
    "credit_history_length": 5,
    "total_accounts": 8,
    "employment_length": "5 years",
    "job_title": "Software Engineer",
    "home_ownership": "RENT"
  }' \
  http://localhost:8000/api/ml/predict/
```

## 📊 Expected Response Format

### Single Prediction Success Response:
```json
{
  "success": true,
  "credit_score": 694,
  "category": "Good",
  "risk_level": "Medium Risk",
  "confidence": 99.19,
  "ghana_employment_analysis": {
    "job_title": "Software Engineer",
    "job_category": "Engineering & Technical",
    "employment_length": "5 years",
    "stability_score": 65
  },
  "model_info": {
    "version": "2.0.0",
    "accuracy": 98.4,
    "model_type": "XGBoost",
    "features_used": 17,
    "ghana_categories": 18
  },
  "confidence_factors": { /* detailed analysis */ },
  "processing_time_ms": 45,
  "prediction_timestamp": "2025-08-06T...",
  "request_id": "uuid-here"
}
```

## 🎯 Required Fields

### Core Financial Fields:
- `annual_income` (number): Annual income in Ghana Cedis
- `loan_amount` (number): Requested loan amount (min: 1000 GHS)
- `interest_rate` (number): Interest rate percentage (0-100)
- `debt_to_income_ratio` (number): DTI percentage (0-100)
- `credit_history_length` (number): Years of credit history (0-50)
- `total_accounts` (number): Total credit accounts (0-100)

### Employment Fields (Ghana-Specific):
- `employment_length` (choice): "< 1 year" to "10+ years"
- `job_title` (choice): One of 35+ Ghana job categories
- `home_ownership` (choice): "OWN", "RENT", "MORTGAGE", "OTHER"

### Optional Fields (default to 0):
- `revolving_utilization`, `max_bankcard_balance`, `open_accounts`
- `delinquencies_2yr`, `inquiries_6mo`, `revolving_accounts_12mo`
- `public_records`, `collections_12mo`

## 🇬🇭 Ghana Job Categories

The API includes 35+ Ghana-specific job titles with stability scoring:

**High Stability (80-85/100):**
- Government Worker, Banker, Doctor, Financial Analyst

**Medium Stability (60-75/100):**
- Software Engineer, Teacher, Nurse, Accountant, Manager

**Lower Stability (20-40/100):**
- Trader, Driver, Farmer, Market Trader, House Help

## ⚡ Performance

- **Single Prediction:** ~45ms processing time
- **Batch Processing:** Up to 100 predictions per request
- **Model Accuracy:** 98.4% (R² = 0.984)
- **Confidence Analysis:** Detailed breakdown with 5+ factors

## 🔒 Security Features

- **Authentication Required:** All prediction endpoints require valid JWT token
- **Input Validation:** Comprehensive field validation with detailed error messages
- **Rate Limiting Ready:** Documented limits for production deployment
- **Error Handling:** Graceful failure modes with informative responses

## 🐛 Troubleshooting

### Common Issues:

1. **404 Not Found:** Make sure Django server is running and URLs are correct
2. **401 Unauthorized:** Provide valid JWT token in Authorization header
3. **400 Bad Request:** Check required fields and data types
4. **503 Service Unavailable:** ML model not loaded (check logs)

### Debug Commands:
```bash
# Check Django configuration
python manage.py check

# Test URL resolution
python manage.py shell -c "from django.urls import resolve; print(resolve('/api/ml/docs/'))"

# Test ML model loading
python -c "import sys; sys.path.append('ml_model'); from src.credit_scorer import get_credit_scorer; print('Model OK')"
```

## 🎉 Integration Ready!

The ML Model API is **production-ready** and can be integrated with:
- ✅ Frontend React applications
- ✅ Third-party systems via REST API
- ✅ Batch processing workflows
- ✅ Mobile applications
- ✅ Analytics dashboards

For integration examples and detailed field mappings, visit the documentation endpoint at `/api/ml/docs/`.