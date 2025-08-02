#!/usr/bin/env python3
"""
Test script for notification system
Run this script to create test notifications and verify the system is working
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append('/home/blackmoor/Projects/FINAL-YEAR-PROJECT/CreditRiskProject/Backend')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from notifications.models import Notification
from users.models import User
from notifications.views import create_notification

def test_notifications():
    print("🧪 Testing Notification System...")
    
    # Get or create a test user
    try:
        test_user = User.objects.first()
        if not test_user:
            print("❌ No users found. Please create a user first.")
            return
        
        print(f"✅ Using test user: {test_user.email}")
        
        # Test 1: Create notification directly
        print("\n📝 Test 1: Creating notification directly...")
        notification = Notification.objects.create(
            recipient=test_user,
            notification_type='SYSTEM_ALERT',
            title='Test Notification',
            message='This is a test notification to verify the system is working.',
        )
        print(f"✅ Created notification ID: {notification.id}")
        
        # Test 2: Create notification with helper function
        print("\n📝 Test 2: Creating notification with helper function...")
        notification2 = create_notification(
            recipient=test_user,
            notification_type='APPLICATION_SUBMITTED',
            title='New Application Submitted',
            message='A new credit application has been submitted and is awaiting review.',
            send_realtime=False  # Skip WebSocket for this test
        )
        print(f"✅ Created notification ID: {notification2.id}")
        
        # Test 3: Check notification count
        print("\n📊 Test 3: Checking notification counts...")
        total_notifications = Notification.objects.filter(recipient=test_user).count()
        unread_notifications = Notification.objects.filter(recipient=test_user, is_read=False).count()
        
        print(f"✅ Total notifications for {test_user.email}: {total_notifications}")
        print(f"✅ Unread notifications: {unread_notifications}")
        
        # Test 4: Test notification types
        print("\n📝 Test 4: Creating different notification types...")
        notification_types = [
            ('STATUS_CHANGE', 'Application Status Updated', 'Your application status has been changed to Under Review.'),
            ('DOCUMENT_UPLOADED', 'Document Uploaded', 'A new document has been uploaded to your application.'),
            ('RISK_ASSESSED', 'Risk Assessment Complete', 'Your credit risk assessment has been completed.'),
            ('DECISION_MADE', 'Application Decision', 'A decision has been made on your credit application.'),
        ]
        
        for notif_type, title, message in notification_types:
            notif = Notification.objects.create(
                recipient=test_user,
                notification_type=notif_type,
                title=title,
                message=message,
            )
            print(f"✅ Created {notif_type}: {notif.id}")
        
        # Final count
        final_count = Notification.objects.filter(recipient=test_user).count()
        print(f"\n🎉 Test completed! Total notifications created: {final_count}")
        
        # Print recent notifications
        print("\n📋 Recent notifications:")
        recent_notifications = Notification.objects.filter(recipient=test_user).order_by('-created_at')[:5]
        for notif in recent_notifications:
            print(f"  • [{notif.get_notification_type_display()}] {notif.title}")
            print(f"    {notif.message}")
            print(f"    Created: {notif.created_at} | Read: {notif.is_read}")
            print()
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_notifications()