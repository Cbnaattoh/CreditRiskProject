#!/usr/bin/env python3
"""
Test real-time notifications via WebSocket simulation
"""

import os
import sys
import django
from django.conf import settings
import asyncio
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Add the project directory to Python path
sys.path.append('/home/blackmoor/Projects/FINAL-YEAR-PROJECT/CreditRiskProject/Backend')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from notifications.views import create_notification
from users.models import User

def test_realtime_notification():
    """Test sending a real-time notification"""
    print("🧪 Testing Real-time Notification System...")
    
    try:
        # Get a test user
        test_user = User.objects.first()
        if not test_user:
            print("❌ No users found. Please create a user first.")
            return
        
        print(f"✅ Using test user: {test_user.email} (ID: {test_user.id})")
        
        # Create a notification with real-time delivery
        print("\n📡 Creating real-time notification...")
        notification = create_notification(
            recipient=test_user,
            notification_type='SYSTEM_ALERT',
            title='Real-time Test Notification',
            message='This notification should appear in real-time in your browser!',
            send_realtime=True
        )
        
        print(f"✅ Created and sent real-time notification ID: {notification.id}")
        print("💡 Check your browser - you should see a toast notification!")
        print(f"💡 The notification bell should update with the new count")
        
        # Create a few more for testing
        for i in range(3):
            notif = create_notification(
                recipient=test_user,
                notification_type='APPLICATION_SUBMITTED',
                title=f'Batch Test Notification {i+1}',
                message=f'This is batch test notification number {i+1}',
                send_realtime=True
            )
            print(f"✅ Sent batch notification {i+1}: {notif.id}")
            
        print("\n🎉 Real-time notification test completed!")
        print("💡 Check your browser to see if the notifications appeared in real-time")
        
    except Exception as e:
        print(f"❌ Error during real-time testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_realtime_notification()