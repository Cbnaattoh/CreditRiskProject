"""
RiskGuard Demo Data Creation Management Command
Creates realistic demo data for project supervisor evaluation
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random
from datetime import datetime, timedelta

# Import models
from applications.models import CreditApplication, MLCreditAssessment, Document, ApplicationNote
from users.models import User, Role, UserRole
from notifications.models import Notification
from reports.models import Report
from risk.models import RiskAssessment

User = get_user_model()


class Command(BaseCommand):
    help = 'Create comprehensive demo data for RiskGuard project evaluation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=25,
            help='Number of demo users to create'
        )
        parser.add_argument(
            '--applications',
            type=int,
            default=50,
            help='Number of demo credit applications to create'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Creating RiskGuard Demo Data...')
        )
        
        # Create demo users
        self.create_demo_users(options['users'])
        
        # Create demo applications
        self.create_demo_applications(options['applications'])
        
        # Create demo notifications
        self.create_demo_notifications()
        
        # Create demo reports
        self.create_demo_reports()
        
        self.stdout.write(
            self.style.SUCCESS('✅ Demo data creation completed successfully!')
        )
        
        # Display access information
        self.display_access_info()

    def create_demo_users(self, count):
        """Create demo users with various roles"""
        self.stdout.write('👥 Creating demo users...')
        
        # Demo user data
        demo_users = [
            {
                'email': 'supervisor@riskguard.com',
                'first_name': 'Project',
                'last_name': 'Supervisor',
                'role': 'system_admin',
                'password': 'SupervisorAccess2024!'
            },
            {
                'email': 'credit.manager@riskguard.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'credit_manager',
                'password': 'CreditManager2024!'
            },
            {
                'email': 'risk.analyst@riskguard.com',
                'first_name': 'Michael',
                'last_name': 'Chen',
                'role': 'risk_analyst',
                'password': 'RiskAnalyst2024!'
            },
            {
                'email': 'loan.officer@riskguard.com',
                'first_name': 'Kwame',
                'last_name': 'Asante',
                'role': 'loan_officer',
                'password': 'LoanOfficer2024!'
            },
            {
                'email': 'compliance.officer@riskguard.com',
                'first_name': 'Ama',
                'last_name': 'Owusu',
                'role': 'compliance_officer',
                'password': 'Compliance2024!'
            }
        ]
        
        for user_data in demo_users:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_active': True,
                    'email_verified': True
                }
            )
            
            if created:
                user.set_password(user_data['password'])
                user.save()
                
                # Assign role
                try:
                    role = Role.objects.get(name=user_data['role'])
                    UserRole.objects.get_or_create(user=user, role=role)
                except Role.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'Role {user_data["role"]} not found')
                    )
                
                self.stdout.write(f'  ✅ Created user: {user.email}')

    def create_demo_applications(self, count):
        """Create demo credit applications with ML assessments"""
        self.stdout.write('📋 Creating demo credit applications...')
        
        # Sample Ghana employment data
        ghana_jobs = [
            ('Software Engineer', 'Engineering & Technical'),
            ('Bank Manager', 'Banking & Finance'),
            ('Doctor', 'Healthcare & Medical'),
            ('Civil Servant', 'Government & Public Service'),
            ('Teacher', 'Education'),
            ('Mining Engineer', 'Mining & Energy'),
            ('Business Owner', 'Business Owner/Trader'),
            ('Pharmacist', 'Healthcare & Medical'),
            ('Accountant', 'Banking & Finance'),
            ('Nurse', 'Healthcare & Medical'),
        ]
        
        # Sample applicant data
        ghana_names = [
            ('Kwame', 'Asante'), ('Ama', 'Owusu'), ('Kofi', 'Mensah'),
            ('Akosua', 'Adjei'), ('Kwaku', 'Boateng'), ('Efua', 'Danso'),
            ('Yaw', 'Osei'), ('Abena', 'Appiah'), ('Kojo', 'Amoah'),
            ('Adwoa', 'Sarpong'), ('Kwabena', 'Gyasi'), ('Afia', 'Konadu')
        ]
        
        statuses = ['pending', 'under_review', 'approved', 'rejected', 'cancelled']
        status_weights = [20, 30, 35, 10, 5]  # Higher chance of approved
        
        for i in range(count):
            # Random applicant data
            first_name, last_name = random.choice(ghana_names)
            job_title, job_category = random.choice(ghana_jobs)
            
            # Generate realistic financial data
            annual_income = random.randint(30000, 200000)  # GHS 30k - 200k
            requested_amount = random.randint(5000, min(annual_income // 2, 100000))
            
            application = CreditApplication.objects.create(
                # Personal Information
                first_name=first_name,
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}.{i}@demo.com",
                phone_number=f"+233{random.randint(100000000, 999999999)}",
                date_of_birth=datetime.now().date() - timedelta(days=random.randint(25*365, 65*365)),
                
                # Employment Information
                employment_status='employed',
                job_title=job_title,
                employment_length=random.choice(['< 1 year', '1 year', '3 years', '5 years', '10+ years']),
                annual_income=Decimal(str(annual_income)),
                
                # Loan Information
                requested_amount=Decimal(str(requested_amount)),
                loan_purpose=random.choice([
                    'business_expansion', 'home_improvement', 'education',
                    'debt_consolidation', 'working_capital', 'equipment_purchase'
                ]),
                loan_term=random.randint(12, 60),
                
                # Address Information
                street_address=f"{random.randint(1, 999)} {random.choice(['Nkrumah', 'Independence', 'Liberation', 'Castle'])} Street",
                city=random.choice(['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast']),
                region=random.choice(['Greater Accra', 'Ashanti', 'Northern', 'Western', 'Central']),
                
                # Financial Information
                monthly_income=Decimal(str(annual_income // 12)),
                existing_debt=Decimal(str(random.randint(0, annual_income // 4))),
                credit_score=random.randint(300, 850),
                
                # Application Status
                status=random.choices(statuses, weights=status_weights)[0],
                submitted_at=timezone.now() - timedelta(days=random.randint(1, 90)),
                
                # Additional fields
                home_ownership=random.choice(['rent', 'own', 'mortgage']),
                marital_status=random.choice(['single', 'married', 'divorced']),
                number_of_dependents=random.randint(0, 5)
            )
            
            # Create ML Assessment for some applications
            if random.random() > 0.3:  # 70% chance of having ML assessment
                self.create_ml_assessment(application, job_category)
            
            # Create application notes
            if random.random() > 0.5:  # 50% chance of having notes
                self.create_application_notes(application)
            
            if i % 10 == 0:
                self.stdout.write(f'  📝 Created {i + 1} applications...')
        
        self.stdout.write(f'  ✅ Created {count} demo applications')

    def create_ml_assessment(self, application, job_category):
        """Create ML credit assessment for an application"""
        
        # Realistic credit score based on application data
        base_score = random.randint(580, 800)
        
        # Adjust score based on income and job category
        if application.annual_income > 100000:
            base_score += random.randint(0, 30)
        if job_category in ['Government & Public Service', 'Banking & Finance']:
            base_score += random.randint(0, 20)
        
        base_score = min(base_score, 850)
        
        # Determine category and risk level
        if base_score >= 800:
            category, risk_level = 'Exceptional', 'Very Low Risk'
        elif base_score >= 740:
            category, risk_level = 'Very Good', 'Low Risk'
        elif base_score >= 670:
            category, risk_level = 'Good', 'Medium Risk'
        elif base_score >= 580:
            category, risk_level = 'Fair', 'High Risk'
        else:
            category, risk_level = 'Poor', 'Very High Risk'
        
        MLCreditAssessment.objects.create(
            application=application,
            credit_score=base_score,
            category=category,
            risk_level=risk_level,
            confidence=random.uniform(85.0, 99.5),
            model_accuracy=98.4,
            ghana_job_category=job_category,
            ghana_employment_score=random.uniform(60.0, 95.0),
            ghana_job_stability_score=random.randint(70, 95),
            model_version='2.0.0',
            confidence_factors={
                'income_stability': random.uniform(0.7, 0.95),
                'employment_history': random.uniform(0.6, 0.9),
                'credit_history': random.uniform(0.5, 0.85),
                'debt_ratio': random.uniform(0.6, 0.9),
                'ghana_employment': random.uniform(0.7, 0.95)
            },
            processing_status='completed',
            processing_time_ms=random.randint(85, 150)
        )

    def create_application_notes(self, application):
        """Create sample application notes"""
        notes = [
            'Initial application review completed. All documents verified.',
            'Contacted employer to verify employment status and salary.',
            'Credit bureau check completed. No red flags identified.',
            'Additional documentation requested from applicant.',
            'Follow-up call scheduled for next week.',
            'Ghana Card verification successful. Identity confirmed.',
            'Bank statements reviewed. Income verification completed.',
            'Risk assessment indicates favorable credit profile.',
            'Application meets all basic eligibility criteria.',
            'Awaiting final approval from credit committee.'
        ]
        
        for _ in range(random.randint(1, 3)):
            ApplicationNote.objects.create(
                application=application,
                note=random.choice(notes),
                created_by=User.objects.filter(is_active=True).first(),
                created_at=timezone.now() - timedelta(days=random.randint(1, 30))
            )

    def create_demo_notifications(self):
        """Create demo notifications"""
        self.stdout.write('🔔 Creating demo notifications...')
        
        users = User.objects.filter(is_active=True)[:10]
        notification_types = [
            'application_submitted',
            'application_approved',
            'application_rejected',
            'ml_assessment_completed',
            'document_uploaded',
            'system_alert'
        ]
        
        for user in users:
            for _ in range(random.randint(3, 8)):
                Notification.objects.create(
                    recipient=user,
                    notification_type=random.choice(notification_types),
                    title=f'Demo Notification for {user.first_name}',
                    message='This is a demo notification created for project evaluation.',
                    is_read=random.choice([True, False]),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )

    def create_demo_reports(self):
        """Create demo reports"""
        self.stdout.write('📊 Creating demo reports...')
        
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.filter(is_active=True).first()
        
        if admin_user:
            Report.objects.create(
                title='Monthly Credit Performance Report',
                description='Comprehensive analysis of credit application performance for the current month',
                report_type='credit_performance',
                generated_by=admin_user,
                file_path='/reports/monthly_credit_performance.pdf',
                parameters={
                    'date_range': '2024-08-01 to 2024-08-31',
                    'applications_reviewed': 127,
                    'approval_rate': '68.5%',
                    'average_credit_score': 692
                }
            )

    def display_access_info(self):
        """Display access information for the supervisor"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('🎯 RISKGUARD PROJECT EVALUATION ACCESS'))
        self.stdout.write('='*60)
        
        self.stdout.write('\n📧 DEMO USER ACCOUNTS:')
        self.stdout.write('-'*30)
        
        demo_accounts = [
            ('Project Supervisor', 'supervisor@riskguard.com', 'SupervisorAccess2024!', 'Full system access'),
            ('Credit Manager', 'credit.manager@riskguard.com', 'CreditManager2024!', 'Credit management'),
            ('Risk Analyst', 'risk.analyst@riskguard.com', 'RiskAnalyst2024!', 'Risk analysis tools'),
            ('Loan Officer', 'loan.officer@riskguard.com', 'LoanOfficer2024!', 'Application processing'),
        ]
        
        for name, email, password, role in demo_accounts:
            self.stdout.write(f'👤 {name}:')
            self.stdout.write(f'   Email: {email}')
            self.stdout.write(f'   Password: {password}')
            self.stdout.write(f'   Role: {role}')
            self.stdout.write('')
        
        self.stdout.write('🌐 APPLICATION URLS:')
        self.stdout.write('-'*20)
        self.stdout.write('Frontend: http://localhost:3000')
        self.stdout.write('Backend API: http://localhost:8000')
        self.stdout.write('API Documentation: http://localhost:8000/api/docs/swagger/')
        self.stdout.write('Admin Panel: http://localhost:8000/admin/')
        self.stdout.write('Database Admin: http://localhost:8080 (optional)')
        self.stdout.write('')
        
        self.stdout.write('📊 DEMO DATA SUMMARY:')
        self.stdout.write('-'*22)
        self.stdout.write(f'Users Created: {User.objects.count()}')
        self.stdout.write(f'Credit Applications: {CreditApplication.objects.count()}')
        self.stdout.write(f'ML Assessments: {MLCreditAssessment.objects.count()}')
        self.stdout.write(f'Notifications: {Notification.objects.count()}')
        self.stdout.write('')
        
        self.stdout.write('🔧 NEXT STEPS:')
        self.stdout.write('-'*12)
        self.stdout.write('1. Access the frontend at http://localhost:3000')
        self.stdout.write('2. Log in with supervisor credentials')
        self.stdout.write('3. Explore credit applications and ML features')
        self.stdout.write('4. Test the comprehensive RBAC system')
        self.stdout.write('5. Review API documentation')
        self.stdout.write('')
        
        self.stdout.write(self.style.SUCCESS('✅ RiskGuard is ready for evaluation!'))
        self.stdout.write('='*60)