#!/usr/bin/env python3
"""
Simple Test Data Insertion Script
Creates basic test data for user: klvnafriyie96@gmail.com
"""

import os
import django
from datetime import datetime, date, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from applications.models import (
    CreditApplication, Applicant, Address, EmploymentInfo, 
    FinancialInfo, BankAccount
)
from notifications.models import Notification

User = get_user_model()

def main():
    """Create simple test data"""
    print("🚀 Creating simple test data for klvnafriyie96@gmail.com")
    print("=" * 50)
    
    try:
        # Get or create user
        email = 'klvnafriyie96@gmail.com'
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': 'Albert',
                'last_name': 'Afio',
                'phone_number': '+233241234567',
                'date_of_birth': date(1996, 5, 15),
                'is_email_verified': True,
                'user_type': 'CUSTOMER'
            }
        )
        
        if created:
            user.set_password('Albertafio#10')
            user.save()
            print(f"✅ Created user: {email}")
        else:
            print(f"✅ User exists: {email}")
        
        # Clear existing data for this user
        CreditApplication.objects.filter(applicant=user).delete()
        Notification.objects.filter(recipient=user).delete()
        print("🧹 Cleared existing data")
        
        # Create a simple DRAFT application
        app1 = CreditApplication.objects.create(
            applicant=user,
            status='DRAFT',
            is_priority=False,
            notes='Test application for development',
            loan_amount=Decimal('50000.00'),
            annual_income=Decimal('60000.00')
        )
        print("✅ Created draft application")
        
        # Create applicant profile
        applicant = Applicant.objects.create(
            application=app1,
            first_name='Albert',
            middle_name='Kwame',
            last_name='Afio',
            date_of_birth=date(1996, 5, 15),
            gender='M',
            marital_status='S',
            national_id='GHA-123456789-1',
            phone_number='+233241234567',
            email='klvnafriyie96@gmail.com'
        )
        print("✅ Created applicant profile")
        
        # Create address
        address = Address.objects.create(
            applicant=applicant,
            address_type='HOME',
            street_address='East Legon, Block 5, House A123',
            city='Accra',
            state_province='Greater Accra',
            postal_code='GA-123-4567',
            country='Ghana',
            is_primary=True
        )
        print("✅ Created address")
        
        # Create employment info
        employment = EmploymentInfo.objects.create(
            applicant=applicant,
            employer_name='Ghana Commercial Bank',
            job_title='Software Engineer',
            employment_type='FULL_TIME',
            start_date=date(2020, 1, 15),
            is_current=True,
            monthly_income=Decimal('5000.00'),
            income_verified=False
        )
        print("✅ Created employment info")
        
        # Create financial info
        financial = FinancialInfo.objects.create(
            applicant=applicant,
            total_assets=Decimal('100000.00'),
            total_liabilities=Decimal('30000.00'),
            monthly_expenses=Decimal('2500.00'),
            has_bankruptcy=False
        )
        print("✅ Created financial info")
        
        # Create bank account
        bank_account = BankAccount.objects.create(
            financial_info=financial,
            account_type='CHECKING',
            bank_name='Ghana Commercial Bank',
            account_number='****1234',
            balance=Decimal('15000.00'),
            is_primary=True
        )
        print("✅ Created bank account")
        
        # Create notifications
        notifications_data = [
            {
                'title': 'Welcome to Credit Risk Platform',
                'message': 'Your account has been successfully created. You can now apply for loans.',
                'notification_type': 'info',
                'is_read': False
            },
            {
                'title': 'Application Started',
                'message': 'You have started a new loan application. Complete all sections to submit.',
                'notification_type': 'info', 
                'is_read': False
            }
        ]
        
        for notif_data in notifications_data:
            Notification.objects.create(
                recipient=user,
                created_at=timezone.now() - timedelta(hours=1),
                **notif_data
            )
        print("✅ Created notifications")
        
        print("=" * 50)
        print("🎉 SIMPLE TEST DATA CREATION COMPLETED!")
        print("=" * 50)
        print("📊 SUMMARY:")
        print(f"   👤 User: {email}")
        print(f"   📋 Applications: 1 (DRAFT)")
        print(f"   👥 Applicant Profile: Complete")
        print(f"   🏠 Address: Ghana location")
        print(f"   💼 Employment: GCB Software Engineer")
        print(f"   💰 Financial: Assets/Liabilities/Income")
        print(f"   🏦 Bank Account: GCB Checking")
        print(f"   🔔 Notifications: 2")
        print("=" * 50)
        print("🔐 LOGIN CREDENTIALS:")
        print(f"   Email: {email}")
        print(f"   Password: Albertafio#10")
        print("=" * 50)
        print("✅ Ready for testing! You can:")
        print("   - Login to the application")
        print("   - Complete the DRAFT application")
        print("   - Submit for processing")
        print("   - Test all features")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()