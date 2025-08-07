# ML API Integration & Security Data Setup

This document explains the ML API integration implemented in your credit risk project and how to test it.

## 🎯 Overview

I've integrated your ML API into the dashboard to provide real-time credit scoring capabilities for users. The integration includes:

1. **Frontend ML API Client**: RTK Query-based API client for ML endpoints
2. **ML Credit Score Widget**: Interactive component for credit score predictions
3. **Dashboard Integration**: Role-based ML features for different user types
4. **Security Data Scripts**: Test data generation for security features

## 📁 Files Created/Modified

### Frontend Files:
- `Frontend/src/components/redux/features/api/ml/mlApi.ts` - ML API client
- `Frontend/src/screens/Home/components/MLCreditScoreWidget.tsx` - ML widget component
- `Frontend/src/screens/Home/index.tsx` - Updated with ML integration
- `Frontend/src/components/redux/store.ts` - Added ML API to Redux store

### Backend/Scripts:
- `Backend/security_data_insertion.py` - Security data insertion script
- `test_ml_integration.py` - ML API integration test script

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to Backend directory
cd Backend

# Install dependencies (if not already done)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create sample security data
python security_data_insertion.py

# Start the Django server
python manage.py runserver
```

### 2. Frontend Setup

```bash
# Navigate to Frontend directory
cd Frontend

# Install dependencies (if not already done)
npm install

# Start the React development server
npm start
```

### 3. Test ML Integration

```bash
# From project root directory
python test_ml_integration.py
```

## 🎮 How to Use the ML Integration

### For Client Users:

1. **Access the Dashboard**: Log in as a client user
2. **Find the ML Widget**: Look for "AI Credit Assessment" widget on the home dashboard
3. **Calculate Credit Score**: 
   - Click "Calculate My Credit Score"
   - Fill in your financial information
   - Click "Load Sample" for demo data
   - Submit to get AI-powered credit score prediction
4. **View Results**: See your credit score, risk level, and Ghana employment analysis

### For Admin/Staff Users:

1. **Monitor ML Model**: View ML model health and status on the dashboard
2. **Check Model Metrics**: See accuracy, version, and performance data
3. **System Overview**: Monitor ML predictions across all users

## 🔧 API Endpoints

The integration uses these ML API endpoints:

- `POST /api/ml/predict/` - Single credit score prediction
- `POST /api/ml/batch-predict/` - Batch predictions (up to 100)
- `GET /api/ml/health/` - Model health check
- `GET /api/ml/docs/` - API documentation

## 📊 Features Implemented

### ML Credit Score Widget
- **Interactive Form**: User-friendly form with validation
- **Sample Data**: Pre-filled demo data for testing
- **Real-time Prediction**: Instant credit score calculation
- **Ghana-Specific Analysis**: Employment category analysis
- **Error Handling**: Proper error messages and loading states

### Dashboard Integration
- **Role-Based Views**: Different interfaces for clients vs. staff
- **Model Health Monitoring**: Real-time ML model status
- **Performance Metrics**: Model accuracy and statistics
- **Responsive Design**: Works on mobile and desktop

### Security Data Features
- **Behavioral Biometrics**: User behavior analysis
- **Suspicious Activity Tracking**: Security event monitoring
- **Risk Level Classification**: Automatic risk assessment
- **Real-time Alerts**: Security notifications

## 🗃️ Security Data Script Features

The `security_data_insertion.py` script creates:

### Sample Users:
- `admin@creditrisk.com` (Admin)
- `analyst@creditrisk.com` (Risk Analyst)
- `client1@example.com` (Client)
- `client2@example.com` (Client)
- `auditor@creditrisk.com` (Auditor)
- `highrisk@example.com` (High-risk test user)

### Behavioral Biometrics:
- Typing patterns (speed, dwell time, rhythm)
- Mouse movement patterns (velocity, accuracy)
- Device interaction patterns (session duration, navigation)
- Confidence scores (0.0 - 1.0)

### Suspicious Activities:
- Login attempts with failed authentication
- Password change activities
- Application submission anomalies
- Automated behavior detection
- 50+ sample activities across 30 days

### High-Risk Scenarios:
- Low-confidence behavioral profiles
- Multiple failed login attempts
- Suspicious IP addresses
- Automated activity patterns

## 🧪 Testing

### ML API Tests

The `test_ml_integration.py` script tests:

1. **Authentication**: User login and token generation
2. **Health Check**: ML model status and availability
3. **Documentation**: API endpoint documentation
4. **Single Prediction**: Individual credit score calculation
5. **Batch Prediction**: Multiple predictions at once

### Test Results

Run the test and expect:
- ✅ All endpoints responding correctly
- ✅ Proper authentication handling
- ✅ Valid prediction responses
- ✅ Error handling working

## 🔍 Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   ```
   Error: psycopg2 module not found
   ```
   **Solution**: Install PostgreSQL dependencies or switch to SQLite for testing

2. **ML Model Not Found**:
   ```
   Error: ML model not available
   ```
   **Solution**: Check if the ML model files are in the correct location (`Backend/ml_model/`)

3. **Authentication Errors**:
   ```
   Error: Failed to authenticate
   ```
   **Solution**: Run the security data script to create test users

4. **Frontend API Errors**:
   ```
   Error: 404 Not Found
   ```
   **Solution**: Ensure Django server is running and API URLs are correct

### Debug Steps:

1. **Check Django Server**: Ensure it's running on `http://localhost:8000`
2. **Verify Database**: Run migrations and check database connections
3. **Test API Endpoints**: Use the test script to verify API responses
4. **Check Console Logs**: Look for JavaScript errors in browser console
5. **Verify User Permissions**: Ensure test users have proper roles

## 📈 Expected Behavior

### Client User Experience:
1. Sees ML Credit Assessment widget on dashboard
2. Can input financial data and get instant credit score
3. Views personalized risk analysis and Ghana employment insights
4. Receives clear, actionable results with confidence scores

### Admin User Experience:
1. Monitors ML model health and performance
2. Views system-wide prediction statistics
3. Can see model accuracy and version information
4. Tracks API usage and performance metrics

### Security Features:
1. Real-time behavioral biometric monitoring
2. Suspicious activity detection and alerts
3. Risk-based user classification
4. Comprehensive security dashboard

## 🔄 Next Steps

1. **Run the Security Script**: Create test data for security features
2. **Test ML Integration**: Verify all endpoints work correctly
3. **Start Both Servers**: Run Django backend and React frontend
4. **Login and Test**: Use created test users to verify functionality
5. **Monitor Performance**: Check API response times and accuracy

## 📞 Support

If you encounter issues:

1. **Check Logs**: Look at Django server console for errors
2. **Verify Setup**: Ensure all dependencies are installed
3. **Test Endpoints**: Use the test script to isolate issues
4. **Review Code**: Check the integration files for any modifications needed

The integration is designed to be robust and handle various scenarios including network errors, model unavailability, and user input validation.

## 🎉 Success Indicators

You'll know the integration is working when:

- ✅ Client users can calculate credit scores on the dashboard
- ✅ Admin users can monitor ML model health
- ✅ Security data appears in the Security section
- ✅ All API endpoints respond with proper data
- ✅ Frontend displays real-time ML predictions
- ✅ Ghana employment analysis works correctly
- ✅ Error handling gracefully manages failures

This integration provides a complete ML-powered credit risk assessment system with comprehensive security monitoring.