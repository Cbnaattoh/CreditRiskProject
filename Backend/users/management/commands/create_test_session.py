"""
Management command to create test user sessions for debugging
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.utils import timezone
from users.models import UserSession, SecurityEvent
import user_agents

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test user sessions for debugging session tracking'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of user to create session for',
            default='clientuser@gmail.com'
        )
        
    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            self.stdout.write(f"Found user: {user.email}")
            
            # Check existing sessions
            existing_sessions = UserSession.objects.filter(user=user, is_active=True)
            self.stdout.write(f"Existing active sessions: {existing_sessions.count()}")
            
            for session in existing_sessions:
                self.stdout.write(f"  - Session {session.id}: {session.device_type} from {session.ip_address}")
            
            # Create a test session
            user_agent_string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            user_agent = user_agents.parse(user_agent_string)
            
            test_session = UserSession.objects.create(
                user=user,
                session_key=f"test_session_{timezone.now().strftime('%Y%m%d_%H%M%S')}",
                ip_address="127.0.0.1",
                user_agent=user_agent_string,
                device_type='desktop',
                browser=f"{user_agent.browser.family} {user_agent.browser.version_string}",
                os=f"{user_agent.os.family} {user_agent.os.version_string}",
                location="Local/Private Network",
                is_active=True,
            )
            
            # Create security event
            SecurityEvent.objects.create(
                user=user,
                event_type='login',
                severity='low',
                description=f'Test session created from desktop',
                ip_address="127.0.0.1",
                user_agent=user_agent_string,
                metadata={
                    'device_type': 'desktop',
                    'browser': f"{user_agent.browser.family} {user_agent.browser.version_string}",
                    'os': f"{user_agent.os.family} {user_agent.os.version_string}",
                    'location': "Local/Private Network",
                    'session_created': True,
                    'test_session': True
                }
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created test session {test_session.id} for {user.email}')
            )
            
            # Show updated session count
            total_sessions = UserSession.objects.filter(user=user, is_active=True).count()
            self.stdout.write(f"Total active sessions now: {total_sessions}")
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} not found')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating test session: {str(e)}')
            )