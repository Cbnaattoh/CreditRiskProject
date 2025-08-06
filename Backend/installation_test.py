#!/usr/bin/env python3
"""
Final installation test - verify all components work
Run this after: pip install -r requirements.txt
"""
import os
import sys

def test_installation():
    """Comprehensive test of the installation"""
    
    print("RiskGuard Installation Test")
    print("=" * 40)
    
    # Test 1: Critical package imports
    print("\n1. Testing critical package imports...")
    critical_packages = [
        'django', 'rest_framework', 'psycopg2', 'corsheaders',
        'django_otp', 'channels', 'drf_spectacular', 'pandas', 
        'numpy', 'sklearn', 'xgboost', 'celery', 'PIL', 'gunicorn'
    ]
    
    failed_imports = []
    for package in critical_packages:
        try:
            __import__(package)
            print(f"   OK: {package}")
        except ImportError as e:
            print(f"   FAILED: {package}")
            failed_imports.append(package)
    
    if failed_imports:
        print(f"\nERROR: Missing packages: {failed_imports}")
        return False
    
    # Test 2: Django setup
    print("\n2. Testing Django configuration...")
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        import django
        django.setup()
        print("   OK: Django setup successful")
        
        # Test model imports
        from applications.models import CreditApplication, MLCreditAssessment
        from users.models import User
        print("   OK: Django models import successfully")
        
    except Exception as e:
        print(f"   FAILED: Django setup - {e}")
        return False
    
    # Test 3: ML functionality
    print("\n3. Testing ML functionality...")
    try:
        import pandas as pd
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        import xgboost as xgb
        
        # Quick ML test
        X = np.array([[1, 2], [3, 4], [5, 6]])
        y = np.array([0, 1, 0])
        
        clf = RandomForestClassifier(n_estimators=2, random_state=42)
        clf.fit(X, y)
        pred1 = clf.predict([[2, 3]])
        
        xgb_clf = xgb.XGBClassifier(n_estimators=2, random_state=42, verbosity=0)
        xgb_clf.fit(X, y)
        pred2 = xgb_clf.predict([[2, 3]])
        
        print("   OK: ML libraries functional")
        
    except Exception as e:
        print(f"   FAILED: ML functionality - {e}")
        return False
    
    # Test 4: API components
    print("\n4. Testing API components...")
    try:
        from rest_framework import serializers, viewsets, status
        from rest_framework.response import Response
        from drf_spectacular.utils import extend_schema
        from rest_framework_simplejwt.tokens import RefreshToken
        
        print("   OK: API components work")
        
    except Exception as e:
        print(f"   FAILED: API components - {e}")
        return False
    
    # Test 5: Production server
    print("\n5. Testing production server...")
    try:
        import gunicorn
        print("   OK: Gunicorn available")
        
    except Exception as e:
        print(f"   FAILED: Gunicorn - {e}")
        return False
    
    # Test 6: Background tasks
    print("\n6. Testing background tasks...")
    try:
        from celery import Celery
        app = Celery('test')
        print("   OK: Celery functional")
        
    except Exception as e:
        print(f"   FAILED: Celery - {e}")
        return False
    
    print("\n" + "=" * 40)
    print("SUCCESS: All components working correctly!")
    print("Your application should run without errors.")
    print("\nNext steps:")
    print("1. Set up environment variables (.env file)")
    print("2. Configure PostgreSQL database")
    print("3. Run: python manage.py migrate")
    print("4. Run: python manage.py runserver")
    
    return True

if __name__ == '__main__':
    success = test_installation()
    if not success:
        print("\nERROR: Some components failed. Check requirements.txt")
        sys.exit(1)
    else:
        print("\nINSTALLATION VERIFIED: Ready to run!")
        sys.exit(0)