from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an admin user with full permissions'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Admin email address')
        parser.add_argument('--password', required=True, help='Admin password')
        parser.add_argument('--first-name', required=True, help='Admin first name')
        parser.add_argument('--last-name', required=True, help='Admin last name')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'User with email {email} already exists'))
            return

        try:
            user = User.objects.create_superuser(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                user_type='ADMIN',
                is_verified=True
            )

            # Assign Administrator role if it exists
            try:
                admin_role = Role.objects.get(name='Administrator')
                user.assign_role(admin_role)
                self.stdout.write(
                    self.style.SUCCESS(f'Assigned Administrator role to {email}')
                )
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING('Administrator role not found. Run setup_rbac first.')
                )

            self.stdout.write(
                self.style.SUCCESS(f'Successfully created admin user: {email}')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create admin user: {str(e)}')
            )