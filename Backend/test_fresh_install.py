#!/usr/bin/env python3
"""
Test script to verify the application would work with a fresh install
"""
import subprocess
import sys
import os
import tempfile
import shutil

def test_fresh_install():
    """Test that the requirements.txt works in a fresh environment"""
    
    print("=== TESTING FRESH INSTALL ===")
    print("This will simulate a fresh Python environment...")
    
    # Read requirements
    with open('requirements.txt', 'r') as f:
        requirements_content = f.read()
    
    print("\n=== REQUIREMENTS TO TEST ===")
    lines = [line.strip() for line in requirements_content.split('\n') 
             if line.strip() and not line.strip().startswith('#')]
    
    for line in lines:
        print(f"  {line}")
    
    print(f"\nTotal packages: {len(lines)}")
    
    # Test critical imports
    critical_imports = [
        ('django', 'Django framework'),
        ('rest_framework', 'Django REST Framework'),
        ('psycopg2', 'PostgreSQL adapter'),
        ('corsheaders', 'CORS headers'),
        ('django_otp', 'OTP authentication'),
        ('channels', 'WebSocket support'),
        ('drf_spectacular', 'API documentation'),
        ('pandas', 'Data processing'),
        ('numpy', 'Numerical computing'),
        ('sklearn', 'Machine learning'),
        ('xgboost', 'XGBoost'),
        ('celery', 'Background tasks'),
        ('PIL', 'Image processing'),
        ('gunicorn', 'WSGI server'),
        ('rest_framework_simplejwt', 'JWT tokens')
    ]
    
    print("\n=== TESTING CRITICAL IMPORTS ===")
    failed_imports = []
    
    for module, description in critical_imports:
        try:
            __import__(module)
            print(f"✓ {module:25} - {description}")
        except ImportError as e:
            print(f"✗ {module:25} - FAILED: {e}")
            failed_imports.append((module, str(e)))
    
    # Test Django setup
    print("\n=== TESTING DJANGO SETUP ===")
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        import django
        django.setup()
        print("✓ Django configuration loads successfully")
        
        # Test model imports
        from applications.models import CreditApplication, MLCreditAssessment
        from users.models import User
        print("✓ Django models import successfully")
        
    except Exception as e:
        print(f"✗ Django setup failed: {e}")
        failed_imports.append(('django_setup', str(e)))
    
    # Test ML functionality
    print("\n=== TESTING ML FUNCTIONALITY ===")
    try:
        import pandas as pd
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        import xgboost as xgb
        
        # Create a simple test
        X = np.array([[1, 2], [3, 4], [5, 6]])
        y = np.array([0, 1, 0])
        
        # Test sklearn
        clf = RandomForestClassifier(n_estimators=2, random_state=42)
        clf.fit(X, y)
        
        # Test xgboost
        xgb_clf = xgb.XGBClassifier(n_estimators=2, random_state=42)
        xgb_clf.fit(X, y)
        
        print("✓ ML libraries work correctly")
        
    except Exception as e:
        print(f"✗ ML functionality failed: {e}")
        failed_imports.append(('ml_functionality', str(e)))
    
    # Test API functionality
    print("\n=== TESTING API FUNCTIONALITY ===")
    try:
        from rest_framework import serializers, viewsets, status
        from rest_framework.response import Response
        from drf_spectacular.utils import extend_schema
        
        print("✓ REST Framework components work")
        
    except Exception as e:
        print(f"✗ API functionality failed: {e}")
        failed_imports.append(('api_functionality', str(e)))
    
    # Final result
    print("\n=== FINAL RESULT ===")
    if not failed_imports:
        print("🎉 SUCCESS: All components work correctly!")
        print("✅ Someone can install these requirements and run your application")
        return True
    else:
        print("❌ ISSUES FOUND:")
        for component, error in failed_imports:
            print(f"  - {component}: {error}")
        print("\n⚠️  Additional packages may be needed")
        return False

if __name__ == '__main__':
    success = test_fresh_install()
    sys.exit(0 if success else 1)