#!/usr/bin/env python3
"""
Security Data Insertion Script

This script creates sample security data including behavioral biometrics
and suspicious activities for testing the security frontend integration.

Run this script from the Backend directory:
    python security_data_insertion.py

Requirements:
    - Django project must be set up
    - Database migrations must be run
    - Users must exist in the system
"""

import os
import sys
import django
import json
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now we can import Django models
from users.models import User
from security.models import BehavioralBiometrics, SuspiciousActivity


def create_sample_users():
    """Create sample users for testing if they don't exist"""
    sample_users = [
        {
            'email': 'admin@creditrisk.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'user_type': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
        },
        {
            'email': 'analyst@creditrisk.com',
            'first_name': 'Risk',
            'last_name': 'Analyst',
            'user_type': 'STAFF',
            'is_staff': True,
        },
        {
            'email': 'client1@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'CLIENT_USER',
        },
        {
            'email': 'client2@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'user_type': 'CLIENT_USER',
        },
        {
            'email': 'auditor@creditrisk.com',
            'first_name': 'Compliance',
            'last_name': 'Auditor',
            'user_type': 'STAFF',
            'is_staff': True,
        }
    ]
    
    created_users = []
    for user_data in sample_users:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'user_type': user_data['user_type'],
                'is_staff': user_data.get('is_staff', False),
                'is_superuser': user_data.get('is_superuser', False),
                'is_active': True,
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print(f"✅ Created user: {user.email}")
        else:
            print(f"👤 User already exists: {user.email}")
        created_users.append(user)
    
    return created_users


def create_behavioral_biometrics(users):
    """Create sample behavioral biometrics data"""
    print("\n🔍 Creating behavioral biometrics data...")
    
    biometrics_data = []
    
    for user in users:
        # Skip if biometric already exists
        if BehavioralBiometrics.objects.filter(user=user).exists():
            print(f"⏭️  Biometric profile already exists for {user.email}")
            continue
            
        # Generate realistic typing patterns
        typing_pattern = {
            "average_dwell_time": random.uniform(80, 150),  # milliseconds
            "average_flight_time": random.uniform(20, 80),
            "typing_speed": random.uniform(30, 80),  # WPM
            "key_pressure_variance": random.uniform(0.1, 0.4),
            "rhythm_consistency": random.uniform(0.7, 0.95),
            "pause_patterns": {
                "short_pauses": random.randint(5, 15),
                "medium_pauses": random.randint(2, 8),
                "long_pauses": random.randint(0, 3)
            }
        }
        
        # Generate mouse movement patterns
        mouse_movement = {
            "average_velocity": random.uniform(200, 600),  # pixels/second
            "click_accuracy": random.uniform(0.85, 0.98),
            "scroll_patterns": {
                "scroll_speed": random.uniform(50, 200),
                "scroll_direction_changes": random.randint(3, 12)
            },
            "movement_smoothness": random.uniform(0.7, 0.95),
            "dwell_time_variance": random.uniform(0.2, 0.6)
        }
        
        # Generate device interaction patterns
        device_interaction = {
            "session_duration": random.uniform(300, 3600),  # seconds
            "click_frequency": random.uniform(0.5, 3.0),  # clicks per minute
            "keyboard_shortcuts_usage": random.uniform(0.1, 0.8),
            "navigation_patterns": {
                "back_button_usage": random.uniform(0.05, 0.3),
                "tab_switching": random.randint(0, 20),
                "page_scroll_depth": random.uniform(0.3, 0.9)
            },
            "idle_time": random.uniform(30, 300)
        }
        
        # Determine confidence score based on user type
        if user.user_type == 'ADMIN' or user.is_staff:
            confidence_score = random.uniform(0.8, 0.95)  # Higher confidence for staff
        else:
            confidence_score = random.uniform(0.6, 0.85)  # Normal confidence for clients
            
        biometric = BehavioralBiometrics.objects.create(
            user=user,
            typing_pattern=typing_pattern,
            mouse_movement=mouse_movement,
            device_interaction=device_interaction,
            confidence_score=confidence_score,
            is_active=True
        )
        
        biometrics_data.append(biometric)
        print(f"✅ Created biometric profile for {user.email} (confidence: {confidence_score:.2f})")
    
    return biometrics_data


def create_suspicious_activities(users):
    """Create sample suspicious activities data"""
    print("\n🚨 Creating suspicious activities data...")
    
    activities = []
    activity_types = ['LOGIN', 'PASSWORD', 'APPLICATION', 'OTHER']
    
    # Generate activities for the last 30 days
    base_date = datetime.now() - timedelta(days=30)
    
    for i in range(50):  # Create 50 sample activities
        user = random.choice(users)
        activity_type = random.choice(activity_types)
        
        # Generate activity details based on type
        if activity_type == 'LOGIN':
            details = {
                "login_attempt": True,
                "unusual_location": random.choice([True, False]),
                "unusual_time": random.choice([True, False]),
                "failed_attempts": random.randint(0, 5),
                "device_info": {
                    "browser": random.choice(["Chrome", "Firefox", "Safari", "Edge"]),
                    "os": random.choice(["Windows", "macOS", "Linux", "iOS", "Android"]),
                    "screen_resolution": random.choice(["1920x1080", "1366x768", "1440x900"])
                }
            }
        elif activity_type == 'PASSWORD':
            details = {
                "password_change": True,
                "multiple_attempts": random.choice([True, False]),
                "weak_password": random.choice([True, False]),
                "no_verification": random.choice([True, False])
            }
        elif activity_type == 'APPLICATION':
            details = {
                "rapid_submissions": random.choice([True, False]),
                "unusual_amounts": random.choice([True, False]),
                "incomplete_data": random.choice([True, False]),
                "application_id": f"APP-{random.randint(1000, 9999)}"
            }
        else:  # OTHER
            details = {
                "suspicious_behavior": True,
                "automated_activity": random.choice([True, False]),
                "rate_limiting_triggered": random.choice([True, False])
            }
        
        # Generate realistic IP addresses
        ip_addresses = [
            "192.168.1.100", "10.0.0.45", "172.16.0.10",
            "203.0.113.45", "198.51.100.10", "93.184.216.34"
        ]
        
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        ]
        
        # Confidence based on activity type and details
        if activity_type == 'LOGIN' and details.get('failed_attempts', 0) > 3:
            confidence = random.uniform(0.8, 0.95)
        elif activity_type == 'PASSWORD' and details.get('no_verification'):
            confidence = random.uniform(0.7, 0.9)
        elif activity_type == 'APPLICATION' and details.get('rapid_submissions'):
            confidence = random.uniform(0.75, 0.9)
        else:
            confidence = random.uniform(0.4, 0.7)
        
        # Create activity with random timestamp within last 30 days
        activity_date = base_date + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        activity = SuspiciousActivity(
            user=user,
            activity_type=activity_type,
            ip_address=random.choice(ip_addresses),
            user_agent=random.choice(user_agents),
            confidence=confidence,
            details=details,
            was_challenged=random.choice([True, False]) if confidence > 0.7 else False,
            was_successful=random.choice([True, False])
        )
        
        # Set the created timestamp manually
        activity.save()
        activity.detected_at = activity_date
        activity.save(update_fields=['detected_at'])
        
        activities.append(activity)
    
    print(f"✅ Created {len(activities)} suspicious activities")
    return activities


def create_high_risk_scenarios():
    """Create some high-risk scenarios for testing alerts"""
    print("\n⚠️  Creating high-risk scenarios...")
    
    # Find or create a test user for high-risk scenarios
    test_user, created = User.objects.get_or_create(
        email='highrisk@example.com',
        defaults={
            'first_name': 'High',
            'last_name': 'Risk',
            'user_type': 'CLIENT_USER',
            'is_active': True,
        }
    )
    
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Created high-risk test user: {test_user.email}")
    
    # Create low-confidence biometric profile
    biometric, created = BehavioralBiometrics.objects.get_or_create(
        user=test_user,
        defaults={
            'typing_pattern': {
                "average_dwell_time": 200,  # Very slow
                "average_flight_time": 150,  # Very slow
                "typing_speed": 15,  # Very slow typing
                "inconsistent_patterns": True
            },
            'mouse_movement': {
                "erratic_movement": True,
                "unusual_click_patterns": True,
                "automation_detected": True
            },
            'device_interaction': {
                "suspicious_navigation": True,
                "rapid_page_changes": True,
                "unusual_session_patterns": True
            },
            'confidence_score': 0.25,  # Very low confidence
            'is_active': True
        }
    )
    
    if created:
        print(f"✅ Created high-risk biometric profile (confidence: {biometric.confidence_score})")
    
    # Create multiple suspicious activities for this user
    high_risk_activities = [
        {
            'activity_type': 'LOGIN',
            'confidence': 0.9,
            'details': {
                'multiple_failed_attempts': 8,
                'unusual_location': True,
                'suspicious_timing': True,
                'different_device': True
            }
        },
        {
            'activity_type': 'APPLICATION',
            'confidence': 0.85,
            'details': {
                'rapid_multiple_submissions': True,
                'unusually_high_amounts': True,
                'incomplete_verification': True
            }
        },
        {
            'activity_type': 'PASSWORD',
            'confidence': 0.8,
            'details': {
                'multiple_change_attempts': True,
                'no_email_verification': True,
                'weak_password_pattern': True
            }
        }
    ]
    
    for activity_data in high_risk_activities:
        activity = SuspiciousActivity.objects.create(
            user=test_user,
            activity_type=activity_data['activity_type'],
            ip_address='185.220.100.240',  # Known suspicious IP range
            user_agent='Mozilla/5.0 (automated-request)',
            confidence=activity_data['confidence'],
            details=activity_data['details'],
            was_challenged=True,
            was_successful=False
        )
        print(f"✅ Created high-risk {activity_data['activity_type']} activity")


def print_summary():
    """Print a summary of created data"""
    print("\n" + "="*50)
    print("🎯 DATA INSERTION SUMMARY")
    print("="*50)
    
    total_users = User.objects.count()
    total_biometrics = BehavioralBiometrics.objects.count()
    total_activities = SuspiciousActivity.objects.count()
    
    print(f"👥 Total Users: {total_users}")
    print(f"🔍 Behavioral Profiles: {total_biometrics}")
    print(f"🚨 Suspicious Activities: {total_activities}")
    
    # Risk level breakdown
    high_risk_biometrics = BehavioralBiometrics.objects.filter(confidence_score__lt=0.5).count()
    medium_risk_biometrics = BehavioralBiometrics.objects.filter(
        confidence_score__gte=0.5, confidence_score__lt=0.8
    ).count()
    low_risk_biometrics = BehavioralBiometrics.objects.filter(confidence_score__gte=0.8).count()
    
    print(f"\n📊 Risk Distribution:")
    print(f"   🔴 High Risk: {high_risk_biometrics}")
    print(f"   🟡 Medium Risk: {medium_risk_biometrics}")
    print(f"   🟢 Low Risk: {low_risk_biometrics}")
    
    # Activity type breakdown
    print(f"\n🔍 Activity Types:")
    for activity_type, display_name in SuspiciousActivity.ACTIVITY_TYPES:
        count = SuspiciousActivity.objects.filter(activity_type=activity_type).count()
        print(f"   {display_name}: {count}")
    
    print("\n✅ Data insertion completed successfully!")
    print("\nNext steps:")
    print("1. Start your Django development server")
    print("2. Log in to the frontend with any of the created users")
    print("3. Navigate to the Security section to see the data")
    print("4. Check the Home dashboard for ML integration")


def main():
    """Main function to run the data insertion script"""
    print("🚀 Starting Security Data Insertion Script")
    print("="*50)
    
    try:
        # Create sample users
        users = create_sample_users()
        
        # Create behavioral biometrics
        biometrics = create_behavioral_biometrics(users)
        
        # Create suspicious activities
        activities = create_suspicious_activities(users)
        
        # Create high-risk scenarios
        create_high_risk_scenarios()
        
        # Print summary
        print_summary()
        
    except Exception as e:
        print(f"❌ Error during data insertion: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()