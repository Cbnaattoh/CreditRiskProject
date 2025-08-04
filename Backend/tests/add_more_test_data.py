#!/usr/bin/env python3
"""
Additional Test Data Script
Adds more comprehensive test data for klvnafriyie96@gmail.com
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
from applications.models import CreditApplication, Applicant, Address, EmploymentInfo, FinancialInfo, BankAccount
from notifications.models import Notification

User = get_user_model()

def main():
    print("🚀 Adding more comprehensive test data...")
    
    try:
        # Get user
        user = User.objects.get(email='klvnafriyie96@gmail.com')
        print(f"✅ Found user: {user.email}")
        
        # Create a second application that's been submitted
        app2 = CreditApplication.objects.create(
            applicant=user,
            status='SUBMITTED',
            submission_date=timezone.now() - timedelta(days=3),
            is_priority=False,
            notes='Second test application - submitted for review',
            loan_amount=Decimal('75000.00'),
            interest_rate=Decimal('14.5'),
            credit_history_length=Decimal('5.0'),
            annual_income=Decimal('72000.00'),
            debt_to_income_ratio=Decimal('0.25'),
            total_accounts=4,
            employment_length='5 years',
            home_ownership='rent'
        )
        print("✅ Created submitted application")
        
        # Create applicant profile for second application
        applicant2 = Applicant.objects.create(
            application=app2,
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
        
        # Create address for second application
        Address.objects.create(
            applicant=applicant2,
            address_type='HOME',
            street_address='Spintex Road, Community 18, Block B',
            city='Accra',
            state_province='Greater Accra',
            postal_code='GA-456-7890',
            country='Ghana',
            is_primary=True
        )
        
        # Create employment for second application
        EmploymentInfo.objects.create(
            applicant=applicant2,
            employer_name='Tech Solutions Ghana Ltd',
            job_title='Senior Software Developer',
            employment_type='FULL_TIME',
            start_date=date(2019, 6, 1),
            is_current=True,
            monthly_income=Decimal('6000.00'),
            income_verified=True
        )
        
        # Create financial info for second application
        financial2 = FinancialInfo.objects.create(
            applicant=applicant2,
            total_assets=Decimal('120000.00'),
            total_liabilities=Decimal('35000.00'),
            monthly_expenses=Decimal('2800.00'),
            has_bankruptcy=False,
            credit_score=725
        )
        
        # Create bank accounts for second application
        BankAccount.objects.create(
            financial_info=financial2,
            account_type='CHECKING',
            bank_name='Standard Chartered Ghana',
            account_number='****5678',
            balance=Decimal('18000.00'),
            is_primary=True
        )
        
        BankAccount.objects.create(
            financial_info=financial2,
            account_type='SAVINGS',
            bank_name='CAL Bank',
            account_number='****9012',
            balance=Decimal('25000.00'),
            is_primary=False
        )
        print("✅ Created complete profile for submitted application")
        
        # Add more notifications
        additional_notifications = [
            {
                'title': 'Application Submitted',
                'message': f'Your application {app2.reference_number} has been submitted and is under review.',
                'notification_type': 'APPLICATION_SUBMITTED',
                'is_read': False
            },
            {
                'title': 'Document Upload Reminder',
                'message': 'Please upload your latest bank statements to complete your application.',
                'notification_type': 'SYSTEM_ALERT',
                'is_read': False
            },
            {
                'title': 'Profile Updated',
                'message': 'Your profile information has been successfully updated.',
                'notification_type': 'SYSTEM_ALERT',
                'is_read': True
            }
        ]
        
        for notif_data in additional_notifications:
            Notification.objects.create(
                recipient=user,
                created_at=timezone.now() - timedelta(hours=2),
                **notif_data
            )
        print("✅ Added more notifications")
        
        print("=" * 50)
        print("🎉 ADDITIONAL TEST DATA COMPLETED!")
        print("=" * 50)
        print("📊 UPDATED SUMMARY:")
        print(f"   👤 User: {user.email}")
        print(f"   📋 Applications: {CreditApplication.objects.filter(applicant=user).count()}")
        print(f"   🔔 Notifications: {Notification.objects.filter(recipient=user).count()}")
        print("   📝 Application Statuses:")
        
        for app in CreditApplication.objects.filter(applicant=user):
            print(f"     - {app.status}: GHS {app.loan_amount} ({app.reference_number or 'No Ref'})")
        
        print("=" * 50)
        print("✅ Ready for comprehensive testing!")
        print("   - Multiple applications with different statuses")
        print("   - Complete financial profiles")
        print("   - Multiple bank accounts")
        print("   - Various notification types")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()