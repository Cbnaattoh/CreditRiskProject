#!/usr/bin/env python3
"""
Debug script to test authentication and application fetching
"""
import os
import sys
import django
import requests
from django.conf import settings

# Add the project path
project_path = '/home/blackmoor/Projects/FINAL-YEAR-PROJECT/CreditRiskProject/Backend'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from applications.models import CreditApplication
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def debug_auth_and_api():
    print("=== DEBUG: Authentication and API Test ===")
    
    # 1. Check if user exists
    try:
        user = User.objects.get(email="klvnafriyie96@gmail.com")
        print(f"✓ User found: {user.email}")
        print(f"  - ID: {user.id}")
        print(f"  - User Type: {user.user_type}")
        print(f"  - Is Active: {user.is_active}")
        print(f"  - Is Staff: {user.is_staff}")
        print(f"  - Is Superuser: {user.is_superuser}")
    except User.DoesNotExist:
        print("✗ User not found!")
        return
    
    # 2. Check applications for this user
    applications = user.applications.all()
    print(f"\n✓ Applications count: {applications.count()}")
    
    for app in applications:
        print(f"  - Application {app.id}: {app.status} (Ref: {app.reference_number})")
        print(f"    Last Updated: {app.last_updated}")
        if app.applicant_info:
            print(f"    Applicant: {app.applicant_info.first_name} {app.applicant_info.last_name}")
    
    # 3. Generate JWT token for API testing
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    print(f"\n✓ JWT Access Token: {access_token[:50]}...")
    
    # 4. Test API endpoint directly
    print(f"\n=== Testing API Endpoint ===")
    
    # Test the applications endpoint
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get('http://localhost:8000/api/applications/', headers=headers)
        print(f"✓ API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API Response Count: {data.get('count', 0)}")
            print(f"✓ API Response Results: {len(data.get('results', []))}")
            
            # Print first application for debugging
            if data.get('results'):
                first_app = data['results'][0]
                print(f"\n✓ First Application Sample:")
                print(f"  - ID: {first_app.get('id')}")
                print(f"  - Status: {first_app.get('status')}")
                print(f"  - Reference: {first_app.get('reference_number')}")
                print(f"  - Has Applicant Info: {'Yes' if first_app.get('applicant_info') else 'No'}")
        else:
            print(f"✗ API Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to API - is Django server running?")
    except Exception as e:
        print(f"✗ API Error: {e}")

if __name__ == "__main__":
    debug_auth_and_api()