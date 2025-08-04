#!/usr/bin/env python3
"""
Test Data Insertion Script for Credit Risk Assessment Platform
Creates comprehensive test data for user: klvnafriyie96@gmail
"""

import os
import sys
import django
from datetime import datetime, date, timedelta
from decimal import Decimal
import random
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from applications.models import (
    CreditApplication, Applicant, Address, EmploymentInfo, 
    FinancialInfo, BankAccount, Document, ApplicationNote
)
from risk.models import RiskAssessment
from notifications.models import Notification
from reports.models import Report

User = get_user_model()

def create_or_get_user():
    """Create or get the test user"""
    email = 'klvnafriyie96@gmail.com'
    password = 'Albertafio#10'
    
    try:
        user = User.objects.get(email=email)
        print(f"✅ User {email} already exists")
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name='Albert',
            last_name='Afio',
            phone_number='+233241234567',
            date_of_birth=date(1996, 5, 15),
            is_email_verified=True,
            user_type='CUSTOMER'
        )
        print(f"✅ Created user: {email}")
    
    return user

def create_credit_applications(user):
    """Create multiple credit applications with different statuses"""
    applications = []
    
    # Clear any existing applications for this user to avoid conflicts
    CreditApplication.objects.filter(applicant=user).delete()
    print("🧹 Cleared existing applications for user")
    
    # Application 1: Approved Application (Create as DRAFT first, then update)
    app1 = CreditApplication.objects.create(
        applicant=user,
        status='DRAFT',
        is_priority=False,
        notes='High-income applicant with excellent credit history',
        loan_amount=Decimal('75000.00'),
        interest_rate=Decimal('12.5'),
        credit_history_length=Decimal('8.5'),
        revolving_utilization=Decimal('25.0'),
        max_bankcard_balance=Decimal('15000.00'),
        delinquencies_2yr=0,
        total_accounts=5,
        inquiries_6mo=1,
        revolving_accounts_12mo=0,
        employment_length='8+ years',
        public_records=0,
        open_accounts=4,
        home_ownership='own',
        collections_12mo=0,
        annual_income=Decimal('85000.00'),
        debt_to_income_ratio=Decimal('0.20')
    )
    # Update to APPROVED with submission date
    app1.status = 'APPROVED'
    app1.submission_date = timezone.now() - timedelta(days=30)
    app1.save()
    applications.append(app1)
    
    # Application 2: Under Review Application (Create as DRAFT first, then update)
    app2 = CreditApplication.objects.create(
        applicant=user,
        status='DRAFT',
        is_priority=True,
        notes='Requires additional income verification',
        loan_amount=Decimal('50000.00'),
        interest_rate=Decimal('15.0'),
        credit_history_length=Decimal('5.0'),
        revolving_utilization=Decimal('45.0'),
        max_bankcard_balance=Decimal('8000.00'),
        delinquencies_2yr=1,
        total_accounts=3,
        inquiries_6mo=2,
        revolving_accounts_12mo=1,
        employment_length='5 years',
        public_records=0,
        open_accounts=3,
        home_ownership='rent',
        collections_12mo=0,
        annual_income=Decimal('60000.00'),
        debt_to_income_ratio=Decimal('0.35')
    )
    # Update to UNDER_REVIEW with submission date
    app2.status = 'UNDER_REVIEW'
    app2.submission_date = timezone.now() - timedelta(days=7)
    app2.save()
    applications.append(app2)
    
    # Application 3: Rejected Application (Create as DRAFT first, then update)
    app3 = CreditApplication.objects.create(
        applicant=user,
        status='DRAFT',
        is_priority=False,
        notes='High debt-to-income ratio and recent delinquencies',
        loan_amount=Decimal('30000.00'),
        interest_rate=Decimal('18.0'),
        credit_history_length=Decimal('3.0'),
        revolving_utilization=Decimal('85.0'),
        max_bankcard_balance=Decimal('12000.00'),
        delinquencies_2yr=3,
        total_accounts=2,
        inquiries_6mo=5,
        revolving_accounts_12mo=2,
        employment_length='2 years',
        public_records=1,
        open_accounts=2,
        home_ownership='rent',
        collections_12mo=1,
        annual_income=Decimal('35000.00'),
        debt_to_income_ratio=Decimal('0.65')
    )
    # Update to REJECTED with submission date
    app3.status = 'REJECTED'
    app3.submission_date = timezone.now() - timedelta(days=60)
    app3.save()
    applications.append(app3)
    
    # Application 4: Draft Application
    app4 = CreditApplication.objects.create(
        applicant=user,
        status='DRAFT',
        is_priority=False,
        notes='Application in progress',
        loan_amount=Decimal('40000.00'),
        annual_income=Decimal('55000.00')
    )
    applications.append(app4)
    
    print(f"✅ Created {len(applications)} credit applications")
    return applications

def create_applicant_profiles(applications):
    """Create detailed applicant profiles for each application"""
    applicants = []
    
    # Applicant for approved application
    applicant1 = Applicant.objects.create(
        application=applications[0],
        first_name='Albert',
        middle_name='Kwame',
        last_name='Afio',
        date_of_birth=date(1996, 5, 15),
        gender='M',
        marital_status='S',
        national_id='GHA-123456789-1',
        tax_id='SSN-A12345678',
        phone_number='+233241234567',
        alternate_phone='+233201234567',
        email='klvnafriyie96@gmail.com'
    )
    applicants.append(applicant1)
    
    # Applicant for under review application
    applicant2 = Applicant.objects.create(
        application=applications[1],
        first_name='Albert',
        middle_name='Kwame',
        last_name='Afio',
        date_of_birth=date(1996, 5, 15),
        gender='M',
        marital_status='S',
        national_id='GHA-123456789-1',
        tax_id='SSN-A12345678',
        phone_number='+233241234567',
        email='klvnafriyie96@gmail.com'
    )
    applicants.append(applicant2)
    
    # Applicant for rejected application
    applicant3 = Applicant.objects.create(
        application=applications[2],
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
    applicants.append(applicant3)
    
    print(f"✅ Created {len(applicants)} applicant profiles")
    return applicants

def create_addresses(applicants):
    """Create addresses for applicants"""
    addresses = []
    
    ghana_addresses = [
        {
            'street_address': 'House No. A123, Block 5, East Legon',
            'city': 'Accra',
            'state_province': 'Greater Accra',
            'postal_code': 'GA-123-4567',
            'country': 'Ghana'
        },
        {
            'street_address': 'Plot 45, Spintex Road, Baatsona',
            'city': 'Accra',
            'state_province': 'Greater Accra',
            'postal_code': 'GA-456-7890',
            'country': 'Ghana'
        },
        {
            'street_address': 'House No. 12, Bantama Estate',
            'city': 'Kumasi',
            'state_province': 'Ashanti',
            'postal_code': 'AK-789-0123',
            'country': 'Ghana'
        }
    ]
    
    for i, applicant in enumerate(applicants):
        addr_data = ghana_addresses[i % len(ghana_addresses)]
        address = Address.objects.create(
            applicant=applicant,
            address_type='HOME',
            is_primary=True,
            **addr_data
        )
        addresses.append(address)
    
    print(f"✅ Created {len(addresses)} addresses")
    return addresses

def create_employment_info(applicants):
    """Create employment information"""
    employment_records = []
    
    employment_data = [
        {
            'employer_name': 'Ghana Commercial Bank',
            'job_title': 'Senior Software Engineer',
            'employment_type': 'FULL_TIME',
            'start_date': date(2019, 1, 15),
            'is_current': True,
            'monthly_income': Decimal('7000.00'),
            'income_verified': True,
            'verification_documents': 'Payslips, Employment Letter'
        },
        {
            'employer_name': 'Tech Solutions Ghana Ltd',
            'job_title': 'Full Stack Developer',
            'employment_type': 'FULL_TIME',
            'start_date': date(2020, 3, 1),
            'is_current': True,
            'monthly_income': Decimal('5000.00'),
            'income_verified': False,
            'verification_documents': 'Payslips pending'
        },
        {
            'employer_name': 'Freelance IT Consulting',
            'job_title': 'IT Consultant',
            'employment_type': 'SELF_EMPLOYED',
            'start_date': date(2021, 6, 1),
            'end_date': date(2023, 12, 31),
            'is_current': False,
            'monthly_income': Decimal('2500.00'),
            'income_verified': False,
            'verification_documents': 'Bank statements'
        }
    ]
    
    for i, applicant in enumerate(applicants):
        emp_data = employment_data[i % len(employment_data)]
        employment = EmploymentInfo.objects.create(
            applicant=applicant,
            **emp_data
        )
        employment_records.append(employment)
    
    print(f"✅ Created {len(employment_records)} employment records")
    return employment_records

def create_financial_info(applicants):
    """Create financial information with bank accounts"""
    financial_records = []
    
    financial_data = [
        {
            'total_assets': Decimal('150000.00'),
            'total_liabilities': Decimal('25000.00'),
            'monthly_expenses': Decimal('3500.00'),
            'has_bankruptcy': False,
            'credit_score': 780
        },
        {
            'total_assets': Decimal('85000.00'),
            'total_liabilities': Decimal('35000.00'),
            'monthly_expenses': Decimal('2800.00'),
            'has_bankruptcy': False,
            'credit_score': 650
        },
        {
            'total_assets': Decimal('25000.00'),
            'total_liabilities': Decimal('45000.00'),
            'monthly_expenses': Decimal('2200.00'),
            'has_bankruptcy': False,
            'credit_score': 520
        }
    ]
    
    bank_data = [
        [
            {'account_type': 'CHECKING', 'bank_name': 'Ghana Commercial Bank', 'balance': '15000.00', 'is_primary': True},
            {'account_type': 'SAVINGS', 'bank_name': 'Standard Chartered Ghana', 'balance': '25000.00', 'is_primary': False}
        ],
        [
            {'account_type': 'CHECKING', 'bank_name': 'Ecobank Ghana', 'balance': '8000.00', 'is_primary': True},
            {'account_type': 'SAVINGS', 'bank_name': 'CAL Bank', 'balance': '12000.00', 'is_primary': False}
        ],
        [
            {'account_type': 'CHECKING', 'bank_name': 'GCB Bank', 'balance': '2500.00', 'is_primary': True}
        ]
    ]
    
    for i, applicant in enumerate(applicants):
        fin_data = financial_data[i % len(financial_data)]
        financial_info = FinancialInfo.objects.create(
            applicant=applicant,
            **fin_data
        )
        financial_records.append(financial_info)
        
        # Create bank accounts
        for bank_info in bank_data[i % len(bank_data)]:
            BankAccount.objects.create(
                financial_info=financial_info,
                account_number=f"****{random.randint(1000, 9999)}",
                **bank_info
            )
    
    print(f"✅ Created {len(financial_records)} financial records with bank accounts")
    return financial_records

def create_risk_assessments(applications):
    """Create risk assessments for applications"""
    risk_assessments = []
    
    risk_data = [
        {
            'risk_score': Decimal('85.5'),
            'risk_rating': 'LOW',
            'probability_of_default': Decimal('0.05'),
            'expected_loss': Decimal('2500.00'),
            'review_notes': 'Excellent credit profile with stable income'
        },
        {
            'risk_score': Decimal('65.2'),
            'risk_rating': 'MEDIUM',
            'probability_of_default': Decimal('0.25'),
            'expected_loss': Decimal('12500.00'),
            'review_notes': 'Good profile but requires income verification'
        },
        {
            'risk_score': Decimal('35.8'),
            'risk_rating': 'HIGH',
            'probability_of_default': Decimal('0.55'),
            'expected_loss': Decimal('16500.00'),
            'review_notes': 'High risk due to debt levels and payment history'
        }
    ]
    
    for i, application in enumerate(applications[:3]):  # Only for submitted applications
        risk_assessment = RiskAssessment.objects.create(
            application=application,
            assessment_date=application.submission_date,
            **risk_data[i]
        )
        risk_assessments.append(risk_assessment)
    
    print(f"✅ Created {len(risk_assessments)} risk assessments")
    return risk_assessments

def create_application_notes(applications, user):
    """Create application notes for tracking"""
    notes = []
    
    note_data = [
        [
            {'note': 'Application submitted with complete documentation', 'is_internal': False},
            {'note': 'Income verification completed successfully', 'is_internal': True},
            {'note': 'Risk assessment shows low risk profile', 'is_internal': True},
            {'note': 'Application approved for loan amount', 'is_internal': False}
        ],
        [
            {'note': 'Application under review - pending income verification', 'is_internal': False},
            {'note': 'Requested additional employment documentation', 'is_internal': True},
            {'note': 'Awaiting updated bank statements', 'is_internal': True}
        ],
        [
            {'note': 'Application submitted with high DTI ratio', 'is_internal': True},
            {'note': 'Multiple recent credit inquiries noted', 'is_internal': True},
            {'note': 'Application rejected due to high risk assessment', 'is_internal': False}
        ]
    ]
    
    for i, application in enumerate(applications[:3]):
        for note_info in note_data[i]:
            note = ApplicationNote.objects.create(
                application=application,
                author=user,
                created_at=application.submission_date + timedelta(days=random.randint(1, 5)),
                **note_info
            )
            notes.append(note)
    
    print(f"✅ Created {len(notes)} application notes")
    return notes

def create_notifications(user):
    """Create notifications for the user"""
    notifications = []
    
    notification_data = [
        {
            'title': 'Application Approved',
            'message': 'Your loan application for GHS 75,000 has been approved!',
            'notification_type': 'success',
            'is_read': True
        },
        {
            'title': 'Additional Documents Required',
            'message': 'Please submit updated income verification for your pending application.',
            'notification_type': 'warning',
            'is_read': False
        },
        {
            'title': 'Application Status Update',
            'message': 'Your application is currently under review by our analysts.',
            'notification_type': 'info',
            'is_read': False
        },
        {
            'title': 'Welcome to Credit Risk Platform',
            'message': 'Welcome! Your account has been successfully created.',
            'notification_type': 'info',
            'is_read': True
        }
    ]
    
    for i, notif_data in enumerate(notification_data):
        notification = Notification.objects.create(
            user=user,
            created_at=timezone.now() - timedelta(days=random.randint(1, 30)),
            **notif_data
        )
        notifications.append(notification)
    
    print(f"✅ Created {len(notifications)} notifications")
    return notifications

def create_reports(user, applications):
    """Create sample reports"""
    reports = []
    
    report_data = [
        {
            'title': 'Q4 2024 Credit Risk Analysis',
            'description': 'Comprehensive risk analysis for Q4 applications',
            'report_type': 'RISK_ANALYSIS',
            'status': 'COMPLETED',
            'file_path': '/reports/q4_2024_risk_analysis.pdf'
        },
        {
            'title': 'Monthly Application Summary - December 2024',
            'description': 'Monthly summary of all loan applications',
            'report_type': 'APPLICATION_SUMMARY',
            'status': 'COMPLETED',
            'file_path': '/reports/dec_2024_summary.pdf'
        },
        {
            'title': 'Personal Credit Profile Report',
            'description': 'Detailed credit profile analysis',
            'report_type': 'CUSTOM',
            'status': 'IN_PROGRESS'
        }
    ]
    
    for report_info in report_data:
        report = Report.objects.create(
            created_by=user,
            created_at=timezone.now() - timedelta(days=random.randint(1, 15)),
            **report_info
        )
        reports.append(report)
    
    print(f"✅ Created {len(reports)} reports")
    return reports

def main():
    """Main function to create all test data"""
    print("🚀 Starting test data creation for klvnafriyie96@gmail.com")
    print("=" * 60)
    
    try:
        # Create user
        user = create_or_get_user()
        
        # Create applications
        applications = create_credit_applications(user)
        
        # Create applicant profiles
        applicants = create_applicant_profiles(applications)
        
        # Create addresses
        addresses = create_addresses(applicants)
        
        # Create employment info
        employment_records = create_employment_info(applicants)
        
        # Create financial info
        financial_records = create_financial_info(applicants)
        
        # Create risk assessments
        risk_assessments = create_risk_assessments(applications)
        
        # Create application notes
        notes = create_application_notes(applications, user)
        
        # Create notifications
        notifications = create_notifications(user)
        
        # Create reports
        reports = create_reports(user, applications)
        
        print("=" * 60)
        print("🎉 TEST DATA CREATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"📊 SUMMARY:")
        print(f"   👤 User: klvnafriyie96@gmail.com")
        print(f"   📋 Applications: {len(applications)}")
        print(f"   👥 Applicant Profiles: {len(applicants)}")
        print(f"   🏠 Addresses: {len(addresses)}")
        print(f"   💼 Employment Records: {len(employment_records)}")
        print(f"   💰 Financial Records: {len(financial_records)}")
        print(f"   ⚠️  Risk Assessments: {len(risk_assessments)}")
        print(f"   📝 Application Notes: {len(notes)}")
        print(f"   🔔 Notifications: {len(notifications)}")
        print(f"   📊 Reports: {len(reports)}")
        print("=" * 60)
        print("🔐 LOGIN CREDENTIALS:")
        print(f"   Email: klvnafriyie96@gmail.com")
        print(f"   Password: Albertafio#10")
        print("=" * 60)
        print("✅ You can now test all features with comprehensive data!")
        
    except Exception as e:
        print(f"❌ Error creating test data: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()