# RiskGuard Backend Requirements

This document explains the dependencies used in the RiskGuard credit risk assessment system.

## Core Requirements

### Framework & Database
- **Django 4.2.7** - Web framework
- **djangorestframework 3.16.0** - REST API framework
- **psycopg2-binary 2.9.7** - PostgreSQL database adapter
- **asgiref 3.8.1** - ASGI utilities

### Authentication & Security
- **djangorestframework-simplejwt 5.5.0** - JWT token authentication
- **django-otp 1.6.0** - Two-factor authentication
- **django-cors-headers 4.3.1** - CORS handling

### API Documentation
- **drf-spectacular 0.28.0** - OpenAPI/Swagger documentation

### Real-time Features
- **channels 4.2.2** - WebSocket support for notifications

### Background Tasks
- **celery 5.5.3** - Asynchronous task processing

### Configuration
- **python-dotenv 1.0.0** - Environment variable management

### Machine Learning & Data Processing
- **pandas 2.0.3** - Data manipulation and analysis
- **numpy 1.24.3** - Numerical computing
- **scikit-learn 1.3.0** - Machine learning algorithms
- **xgboost 1.7.5** - Gradient boosting framework

### Media Processing
- **Pillow 10.4.0** - Image processing for document uploads

### Production Server
- **gunicorn 21.2.0** - WSGI HTTP server for production

## Installation

```bash
# Install all requirements
pip install -r requirements.txt

# Or install individual components
pip install Django==4.2.7 djangorestframework==3.16.0
```

## Validation

To validate that all requirements are properly installed:

```bash
python validate_requirements.py
```

## Development Requirements (Optional)

For development and testing, you may also want to install:

```bash
# Testing
pip install pytest>=7.0.0 pytest-django>=4.5.0

# Code formatting
pip install black>=22.0.0 flake8>=5.0.0

# ML visualization (for model analysis)
pip install streamlit>=1.25.0 plotly>=5.15.0 shap>=0.41.0
```

## Architecture Notes

### ML Model Integration
The system integrates with XGBoost models for:
- Credit score prediction (300-850 range)
- Ghana-specific employment analysis
- Risk assessment with 98.4% accuracy

### Database Design
- PostgreSQL for structured data storage
- Support for complex financial calculations
- Address normalization for Ghana locations

### Security Features
- JWT-based authentication
- MFA with TOTP support
- Rate limiting and brute force protection
- Secure file upload handling

### API Features
- RESTful API design
- OpenAPI/Swagger documentation
- WebSocket support for real-time notifications
- CORS configured for frontend integration

## Environment Setup

Required environment variables:
```bash
SECRET_KEY=your-secret-key
DEBUG=True/False
DB_NAME=creditrisk_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

## Production Considerations

For production deployment:
1. Set `DEBUG=False`
2. Use a strong `SECRET_KEY`
3. Configure proper database credentials
4. Set up Redis for Celery (background tasks)
5. Configure nginx as reverse proxy
6. Use environment-specific settings