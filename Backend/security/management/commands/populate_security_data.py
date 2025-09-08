from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from security.models import BehavioralBiometrics, SuspiciousActivity
from django.utils import timezone
from datetime import datetime, timedelta
import random
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate security tables with sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing security data first',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing security data...')
            BehavioralBiometrics.objects.all().delete()
            SuspiciousActivity.objects.all().delete()

        self.stdout.write('Creating sample security data...')
        
        # Get active users
        users = list(User.objects.filter(is_active=True))
        if not users:
            self.stdout.write(
                self.style.ERROR('No active users found. Please create some users first.')
            )
            return

        # Create behavioral biometrics for users
        self.create_behavioral_biometrics(users)
        
        # Create suspicious activities
        self.create_suspicious_activities(users)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample security data!')
        )

    def create_behavioral_biometrics(self, users):
        """Create behavioral biometric profiles for users"""
        self.stdout.write('Creating behavioral biometrics...')
        
        for user in users[:15]:  # Limit to first 15 users
            # Generate random typing patterns
            typing_pattern = {
                'average_dwell_time': random.uniform(80, 200),
                'average_flight_time': random.uniform(50, 150),
                'typing_speed': random.uniform(30, 80),
                'key_pressure_variance': random.uniform(0.1, 0.8),
                'rhythm_consistency': random.uniform(0.3, 0.9)
            }
            
            # Generate random mouse movement patterns
            mouse_movement = {
                'average_speed': random.uniform(200, 800),
                'click_duration': random.uniform(50, 200),
                'movement_smoothness': random.uniform(0.2, 0.9),
                'double_click_interval': random.uniform(200, 500),
                'scroll_behavior': random.uniform(0.1, 0.8)
            }
            
            # Generate device interaction patterns
            device_interaction = {
                'session_duration': random.uniform(300, 7200),  # 5 min to 2 hours
                'clicks_per_minute': random.uniform(5, 25),
                'keyboard_usage_ratio': random.uniform(0.3, 0.7),
                'idle_time_ratio': random.uniform(0.1, 0.4)
            }
            
            # Generate confidence score
            confidence_score = random.uniform(0.2, 0.95)
            
            BehavioralBiometrics.objects.create(
                user=user,
                typing_pattern=typing_pattern,
                mouse_movement=mouse_movement,
                device_interaction=device_interaction,
                confidence_score=confidence_score,
                is_active=True
            )
        
        self.stdout.write(f'Created {BehavioralBiometrics.objects.count()} behavioral profiles')

    def create_suspicious_activities(self, users):
        """Create suspicious activity records"""
        self.stdout.write('Creating suspicious activities...')
        
        activity_types = ['LOGIN', 'PASSWORD', 'APPLICATION', 'OTHER']
        risk_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        
        # Create activities over the past 30 days
        for _ in range(50):
            user = random.choice(users)
            activity_type = random.choice(activity_types)
            
            # Generate detection time (within last 30 days)
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            detected_at = timezone.now() - timedelta(
                days=days_ago, hours=hours_ago, minutes=minutes_ago
            )
            
            # Generate confidence level
            confidence = random.uniform(0.1, 1.0)
            
            # Generate realistic IP addresses
            ip_addresses = [
                '192.168.1.100', '10.0.0.50', '172.16.0.25', 
                '203.0.113.45', '198.51.100.32', '192.0.2.18'
            ]
            
            # Generate user agents
            user_agents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)'
            ]
            
            # Generate activity details based on type
            details = self.generate_activity_details(activity_type, confidence)
            
            SuspiciousActivity.objects.create(
                user=user,
                activity_type=activity_type,
                detected_at=detected_at,
                ip_address=random.choice(ip_addresses),
                user_agent=random.choice(user_agents),
                confidence=confidence,
                details=details,
                was_challenged=random.choice([True, False]),
                was_successful=random.choice([True, False])
            )
        
        self.stdout.write(f'Created {SuspiciousActivity.objects.count()} suspicious activities')

    def generate_activity_details(self, activity_type, confidence):
        """Generate realistic activity details based on type and confidence"""
        base_details = {
            'detection_method': 'behavioral_analysis',
            'confidence_level': f'{confidence:.2f}',
            'timestamp': timezone.now().isoformat()
        }
        
        if activity_type == 'LOGIN':
            base_details.update({
                'login_method': random.choice(['password', 'sso', 'mfa']),
                'device_fingerprint': f'device_{random.randint(1000, 9999)}',
                'geolocation': random.choice(['US', 'CA', 'UK', 'DE', 'FR']),
                'unusual_patterns': random.choice([
                    'unusual_time', 'new_location', 'different_device', 'typing_pattern_mismatch'
                ])
            })
        elif activity_type == 'PASSWORD':
            base_details.update({
                'change_type': random.choice(['password_reset', 'password_update']),
                'verification_method': random.choice(['email', 'sms', 'security_questions']),
                'strength_score': random.uniform(0.3, 1.0),
                'suspicious_indicators': random.choice([
                    'rapid_changes', 'weak_password', 'common_password'
                ])
            })
        elif activity_type == 'APPLICATION':
            base_details.update({
                'action_type': random.choice(['submit', 'update', 'delete']),
                'form_completion_time': random.uniform(30, 3600),
                'field_modifications': random.randint(1, 10),
                'anomaly_type': random.choice([
                    'unusual_speed', 'pattern_deviation', 'data_inconsistency'
                ])
            })
        else:  # OTHER
            base_details.update({
                'activity_description': 'Unknown activity pattern detected',
                'risk_factors': random.choice([
                    'multiple_failed_attempts', 'suspicious_navigation', 'automated_behavior'
                ])
            })
        
        return base_details