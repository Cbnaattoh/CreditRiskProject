#!/usr/bin/env python3
"""
Test the notification API endpoints
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your Django server runs on a different port
API_URL = f"{BASE_URL}/api"

def get_auth_token():
    """Get authentication token for API testing"""
    login_url = f"{API_URL}/auth/login/"
    
    # You'll need to adjust these credentials to match a user in your system
    credentials = {
        "email": "klvnafriyie123@gmail.com",  # Replace with actual user email
        "password": "your_password_here"      # Replace with actual password
    }
    
    try:
        response = requests.post(login_url, json=credentials)
        if response.status_code == 200:
            data = response.json()
            return data.get('access')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def test_notifications_api():
    """Test notification API endpoints"""
    print("🧪 Testing Notification API Endpoints...")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        print("💡 Please update the credentials in test_api.py")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("✅ Authentication successful")
    
    # Test 1: Get all notifications
    print("\n📝 Test 1: Getting all notifications...")
    response = requests.get(f"{API_URL}/notifications/", headers=headers)
    if response.status_code == 200:
        notifications = response.json()
        print(f"✅ Retrieved {len(notifications)} notifications")
        for notif in notifications[:3]:  # Show first 3
            print(f"  • {notif['title']} ({notif['notification_type_display']})")
    else:
        print(f"❌ Failed to get notifications: {response.status_code} - {response.text}")
    
    # Test 2: Get unread count
    print("\n📊 Test 2: Getting unread count...")
    response = requests.get(f"{API_URL}/notifications/unread_count/", headers=headers)
    if response.status_code == 200:
        count_data = response.json()
        print(f"✅ Unread notifications: {count_data['count']}")
    else:
        print(f"❌ Failed to get unread count: {response.status_code}")
    
    # Test 3: Get unread notifications
    print("\n📝 Test 3: Getting unread notifications...")
    response = requests.get(f"{API_URL}/notifications/unread/", headers=headers)
    if response.status_code == 200:
        unread_notifications = response.json()
        print(f"✅ Retrieved {len(unread_notifications)} unread notifications")
    else:
        print(f"❌ Failed to get unread notifications: {response.status_code}")
    
    # Test 4: Mark a notification as read (if there are any)
    if 'notifications' in locals() and notifications:
        print("\n📝 Test 4: Marking notification as read...")
        first_notif_id = notifications[0]['id']
        response = requests.post(f"{API_URL}/notifications/{first_notif_id}/mark_read/", headers=headers)
        if response.status_code == 200:
            print(f"✅ Marked notification {first_notif_id} as read")
        else:
            print(f"❌ Failed to mark notification as read: {response.status_code}")
    
    print("\n🎉 API testing completed!")

if __name__ == "__main__":
    test_notifications_api()