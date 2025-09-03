#!/usr/bin/env python3
"""
Fix Users Who Should Be Verified
================================

This script finds users who successfully completed email verification
but have is_verified=False due to the previous bug, and fixes their status.

Usage:
    python fix_verified_users.py

"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User

def fix_verified_users():
    """Fix users who should be verified but aren't"""
    print("=" * 60)
    print("FIXING VERIFIED USERS")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    print()
    
    # Find users who are likely verified but have is_verified=False
    # These would be users who:
    # 1. Have is_verified=False
    # 2. Are CLIENT users (completed registration)
    # 3. Have Ghana card verification data (completed full registration flow)
    
    unverified_users = User.objects.filter(
        is_verified=False,
        user_type='CLIENT',
        ghana_card_number__isnull=False
    ).exclude(ghana_card_number='')
    
    print(f"Found {unverified_users.count()} users who completed registration but are not marked as verified:")
    print()
    
    for user in unverified_users:
        print(f"User: {user.email}")
        print(f"  - Created: {user.date_joined}")
        print(f"  - User Type: {user.user_type}")
        print(f"  - Ghana Card: {user.ghana_card_number}")
        print(f"  - Currently verified: {user.is_verified}")
        print()
    
    if unverified_users.exists():
        confirm = input("Do you want to mark these users as verified? (y/N): ")
        if confirm.lower() in ['y', 'yes']:
            updated_count = 0
            for user in unverified_users:
                user.is_verified = True
                user.save(update_fields=['is_verified'])
                print(f"✅ Updated {user.email} to verified=True")
                updated_count += 1
            
            print(f"\n🎉 Successfully updated {updated_count} users!")
        else:
            print("❌ No changes made.")
    else:
        print("✅ No users need to be fixed.")
    
    print(f"\nCompleted at: {datetime.now()}")

if __name__ == '__main__':
    fix_verified_users()