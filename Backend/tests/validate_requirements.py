#!/usr/bin/env python3
"""
Validate that all required packages are available and can be imported
"""
import sys
import importlib

# Core packages that should be importable
required_imports = [
    ('django', 'Django framework'),
    ('rest_framework', 'Django REST Framework'),
    ('psycopg2', 'PostgreSQL adapter'),
    ('corsheaders', 'Django CORS headers'),
    ('django_otp', 'Django OTP'),
    ('channels', 'Django Channels'),
    ('drf_spectacular', 'API documentation'),
    ('pandas', 'Data analysis'),
    ('numpy', 'Numerical computing'),
    ('sklearn', 'Machine learning'),
    ('xgboost', 'XGBoost ML'),
    ('PIL', 'Pillow image processing'),
    ('celery', 'Background tasks'),
    ('dotenv', 'Environment variables'),
    ('rest_framework_simplejwt', 'JWT authentication'),
    ('gunicorn', 'WSGI server')
]

def validate_imports():
    """Test that all required packages can be imported"""
    print("=== VALIDATING REQUIREMENTS ===")
    print()
    
    failed_imports = []
    
    for module_name, description in required_imports:
        try:
            module = importlib.import_module(module_name)
            version = getattr(module, '__version__', 'unknown')
            print(f"✓ {module_name:25} {version:15} - {description}")
        except ImportError as e:
            print(f"✗ {module_name:25} {'FAILED':15} - {description}")
            failed_imports.append((module_name, str(e)))
    
    print()
    
    if failed_imports:
        print("=== FAILED IMPORTS ===")
        for module_name, error in failed_imports:
            print(f"  {module_name}: {error}")
        print()
        print("Run: pip install -r requirements.txt")
        return False
    else:
        print("✓ All required packages are available!")
        return True

def check_django_setup():
    """Test Django configuration"""
    try:
        import os
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        
        import django
        django.setup()
        
        print("✓ Django setup successful")
        return True
    except Exception as e:
        print(f"✗ Django setup failed: {e}")
        return False

def check_ml_model():
    """Test ML model functionality"""
    try:
        import sys
        import os
        
        # Add ML model path
        ml_path = os.path.join(os.path.dirname(__file__), 'ml_model')
        if ml_path not in sys.path:
            sys.path.append(ml_path)
        
        from ml_model.src.credit_scorer import get_credit_scorer
        
        scorer = get_credit_scorer()
        health = scorer.health_check()
        
        if health['status'] == 'healthy':
            print("✓ ML model is functional")
            return True
        else:
            print(f"⚠ ML model status: {health['status']}")
            return False
            
    except Exception as e:
        print(f"⚠ ML model check failed: {e}")
        return False

if __name__ == '__main__':
    print("RiskGuard Backend Requirements Validation")
    print("=" * 50)
    
    # Test imports
    imports_ok = validate_imports()
    
    if imports_ok:
        print("\n=== DJANGO CONFIGURATION TEST ===")
        django_ok = check_django_setup()
        
        print("\n=== ML MODEL TEST ===")
        ml_ok = check_ml_model()
        
        print("\n=== FINAL RESULT ===")
        if django_ok and ml_ok:
            print("🎉 All systems operational!")
            sys.exit(0)
        else:
            print("⚠ Some components need attention")
            sys.exit(1)
    else:
        print("❌ Missing required packages")
        sys.exit(1)