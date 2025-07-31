from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from users.models import Permission, Role, User

class Command(BaseCommand):
    help = 'Set up initial RBAC permissions and roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset all permissions and roles (WARNING: This will delete existing data)',
        )
        parser.add_argument(
            '--update-existing-users',
            action='store_true',
            help='Update existing users with appropriate roles based on their user_type',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting all RBAC data...'))
            Permission.objects.all().delete()
            Role.objects.all().delete()

        self.create_permissions()
        self.create_roles()
        
        if options['update_existing_users']:
            self.assign_roles_to_existing_users()
        
        self.stdout.write(self.style.SUCCESS('RBAC setup completed successfully!'))

    def create_permissions(self):
        """Create application permissions"""
        
        permissions_data = [
            # User Management
            ('user_view_all', 'View All Users', 'Can view all user profiles and information'),
            ('user_edit_all', 'Edit All Users', 'Can edit any user profile and information'),
            ('user_delete', 'Delete Users', 'Can delete user accounts'),
            ('user_manage_roles', 'Manage User Roles', 'Can assign/remove roles from users'),
            
            # Role Management
            ('role_view', 'View Roles', 'Can view roles and permissions'),
            ('role_create', 'Create Roles', 'Can create new roles'),
            ('role_edit', 'Edit Roles', 'Can modify existing roles'),
            ('role_delete', 'Delete Roles', 'Can delete roles'),
            ('role_assign', 'Assign Roles', 'Can assign roles to users'),
            
            # Permission Management
            ('manage_permissions', 'Manage Permissions', 'Can create and modify permissions'),
            ('view_permissions', 'View Permissions', 'Can view permissions'),
            
            # System Administration
            ('system_settings', 'System Settings', 'Can modify system settings'),
            ('system_logs', 'View System Logs', 'Can view system logs and audit trails'),
            ('system_backup', 'System Backup', 'Can create and manage system backups'),
            ('view_audit_logs', 'View Audit Logs', 'Can view permission audit logs'),
            ('view_dashboard', 'View Dashboard', 'Can view admin dashboard'),
            
            # Data Management
            ('data_export', 'Export Data', 'Can export data from the system'),
            ('data_import', 'Import Data', 'Can import data into the system'),
            ('data_delete', 'Delete Data', 'Can delete data from the system'),
            
            # Reporting
            ('report_view', 'View Reports', 'Can view reports and analytics'),
            ('report_create', 'Create Reports', 'Can create custom reports'),
            ('report_edit', 'Edit Reports', 'Can edit reports'),
            ('report_delete', 'Delete Reports', 'Can delete reports'),
            ('report_share', 'Share Reports', 'Can share reports with other users'),
            ('report_comment', 'Comment on Reports', 'Can add comments to reports'),
            ('report_admin', 'Manage Reports', 'Can manage all reports and analytics'),
            ('report_template_create', 'Create Report Templates', 'Can create report templates'),
            ('report_template_edit', 'Edit Report Templates', 'Can edit report templates'),
            ('report_template_delete', 'Delete Report Templates', 'Can delete report templates'),
            ('report_schedule_view', 'View Scheduled Reports', 'Can view scheduled reports'),
            ('report_schedule_create', 'Create Scheduled Reports', 'Can create scheduled reports'),
            ('report_schedule_edit', 'Edit Scheduled Reports', 'Can edit scheduled reports'),
            ('report_schedule_delete', 'Delete Scheduled Reports', 'Can delete scheduled reports'),
            
            # Risk Management
            ('risk_view', 'View Risk Data', 'Can view risk assessment data'),
            ('risk_edit', 'Edit Risk Data', 'Can modify risk assessments'),
            ('risk_approve', 'Approve Risk Assessments', 'Can approve risk assessments'),
            ('risk_delete', 'Delete Risk Data', 'Can delete risk assessment data'),
            
            # Compliance
            ('compliance_view', 'View Compliance', 'Can view compliance reports'),
            ('compliance_edit', 'Edit Compliance', 'Can modify compliance data'),
            ('compliance_audit', 'Audit Compliance', 'Can perform compliance audits'),
            
            # Client Management
            ('client_view', 'View Client Data', 'Can view client information'),
            ('client_edit', 'Edit Client Data', 'Can modify client information'),
            ('client_delete', 'Delete Client Data', 'Can delete client records'),
            
            # Self-management permissions (for regular users)
            ('view_own_profile', 'View Own Profile', 'Can view own profile'),
            ('edit_own_profile', 'Edit Own Profile', 'Can edit own profile'),
        ]

        created_count = 0
        for codename, name, description in permissions_data:
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                defaults={
                    'name': name,
                    'description': description
                }
            )
            if created:
                created_count += 1

        self.stdout.write(f'Created {created_count} permissions')

    def create_roles(self):
        """Create roles and assign permissions"""
        
        roles_permissions = {
            'Administrator': {
                'permissions': [
                    # Full system access
                    'user_view_all', 'user_edit_all', 'user_delete', 'user_manage_roles',
                    'role_view', 'role_create', 'role_edit', 'role_delete', 'role_assign',
                    'manage_permissions', 'view_permissions',
                    'system_settings', 'system_logs', 'system_backup', 'view_audit_logs', 'view_dashboard',
                    'data_export', 'data_import', 'data_delete',
                    'report_view', 'report_create', 'report_edit', 'report_delete', 'report_share', 'report_comment', 'report_admin',
                    'report_template_create', 'report_template_edit', 'report_template_delete',
                    'report_schedule_view', 'report_schedule_create', 'report_schedule_edit', 'report_schedule_delete',
                    'risk_view', 'risk_edit', 'risk_approve', 'risk_delete',
                    'compliance_view', 'compliance_edit', 'compliance_audit',
                    'client_view', 'client_edit', 'client_delete',
                    'view_own_profile', 'edit_own_profile',
                ],
                'is_default': False,
                'description': 'Full system administrator with all permissions'
            },
            'Risk Analyst': {
                'permissions': [
                    # Risk-focused permissions
                    'user_view_all',
                    'role_view',
                    'view_permissions',
                    'risk_view', 'risk_edit', 'risk_approve',
                    'compliance_view', 'compliance_edit',
                    'report_view', 'report_create', 'report_edit', 'report_share', 'report_comment',
                    'data_export', 'client_view',
                    'view_own_profile', 'edit_own_profile',
                ],
                'is_default': False,
                'description': 'Risk analysis specialist with risk management permissions'
            },
            'Compliance Auditor': {
                'permissions': [
                    # Audit-focused permissions
                    'user_view_all',
                    'role_view',
                    'view_permissions',
                    'risk_view',
                    'compliance_view', 'compliance_edit', 'compliance_audit',
                    'report_view', 'report_create',
                    'system_logs', 'view_audit_logs', 'data_export',
                    'client_view',
                    'view_own_profile', 'edit_own_profile',
                ],
                'is_default': False,
                'description': 'Compliance auditor with audit and compliance permissions'
            },
            'Client User': {
                'permissions': [
                    # Limited client permissions
                    'risk_view',
                    'compliance_view',
                    'report_view',
                    'view_own_profile', 'edit_own_profile',
                ],
                'is_default': True,
                'description': 'Standard client user with limited view permissions'
            },
            'Manager': {
                'permissions': [
                    # Management permissions
                    'user_view_all', 'user_edit_all',
                    'role_view', 'role_assign',
                    'view_permissions',
                    'risk_view', 'risk_edit', 'risk_approve',
                    'compliance_view', 'compliance_edit',
                    'report_view', 'report_create', 'report_admin',
                    'data_export', 'client_view', 'client_edit',
                    'view_own_profile', 'edit_own_profile',
                ],
                'is_default': False,
                'description': 'Management role with elevated permissions'
            }
        }

        created_count = 0
        for role_name, role_data in roles_permissions.items():
            permission_codenames = role_data['permissions']
            is_default = role_data.get('is_default', False)
            description = role_data.get('description', f'Default {role_name} role')
            
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={
                    'description': description,
                    'is_default': is_default
                }
            )
            
            if created:
                created_count += 1
            else:
                # Update existing role
                role.description = description
                role.is_default = is_default
                role.save()
            
            # Clear existing permissions and add new ones
            role.permissions.clear()
            for codename in permission_codenames:
                try:
                    permission = Permission.objects.get(codename=codename)
                    role.permissions.add(permission)
                except Permission.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'Permission {codename} not found for role {role_name}')
                    )

        self.stdout.write(f'Created/Updated {len(roles_permissions)} roles')

    def assign_roles_to_existing_users(self):
        """Assign roles to existing users based on their user_type"""
        
        user_type_role_mapping = {
            'ADMIN': 'Administrator',
            'ANALYST': 'Risk Analyst',
            'AUDITOR': 'Compliance Auditor',
            'CLIENT': 'Client User',
        }

        assigned_count = 0
        updated_count = 0
        
        for user_type, role_name in user_type_role_mapping.items():
            try:
                role = Role.objects.get(name=role_name)
                users = User.objects.filter(user_type=user_type)
                
                for user in users:
                    # Check if user already has this role
                    existing_role = user.get_roles().filter(name=role_name).first()
                    
                    if not existing_role:
                        user_role = user.assign_role(role)
                        if user_role:
                            assigned_count += 1
                            self.stdout.write(
                                f'Assigned {role_name} to {user.email}'
                            )
                    else:
                        updated_count += 1
                        
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Role {role_name} not found for user type {user_type}')
                )

        self.stdout.write(f'Assigned roles to {assigned_count} users, {updated_count} already had roles')

    def create_default_admin(self):
        """Create a default admin user if none exists"""
        admin_users = User.objects.filter(user_type='ADMIN')
        
        if not admin_users.exists():
            self.stdout.write(self.style.WARNING('No admin users found. Creating default admin...'))
            
            try:
                admin_user = User.objects.create_superuser(
                    email='admin@riskguard.com',
                    password='ChangeMe123!',
                    first_name='System',
                    last_name='Administrator',
                    user_type='ADMIN',
                    is_verified=True
                )
                
                # Assign Administrator role
                try:
                    admin_role = Role.objects.get(name='Administrator')
                    admin_user.assign_role(admin_role)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created default admin user: {admin_user.email}\n'
                            f'Password: ChangeMe123! (CHANGE THIS IMMEDIATELY!)'
                        )
                    )
                except Role.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING('Administrator role not found')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to create default admin: {str(e)}')
                )

    def display_summary(self):
        """Display a summary of the RBAC setup"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('RBAC SETUP SUMMARY'))
        self.stdout.write('='*50)
        
        # Permissions summary
        total_permissions = Permission.objects.count()
        self.stdout.write(f'Total Permissions: {total_permissions}')
        
        # Roles summary
        roles = Role.objects.all()
        self.stdout.write(f'Total Roles: {roles.count()}')
        
        for role in roles:
            permission_count = role.permissions.count()
            user_count = role.userrole_set.filter(is_active=True).count()
            default_marker = ' (DEFAULT)' if role.is_default else ''
            
            self.stdout.write(
                f'  - {role.name}{default_marker}: {permission_count} permissions, {user_count} users'
            )
        
        # Users summary
        user_types = User.objects.values('user_type').distinct()
        self.stdout.write('\nUser Distribution:')
        
        for user_type in user_types:
            count = User.objects.filter(user_type=user_type['user_type']).count()
            self.stdout.write(f'  - {user_type["user_type"]}: {count} users')
        
        self.stdout.write('\n' + '='*50)

    def handle(self, *args, **options):
        """Main handler with enhanced flow"""
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting all RBAC data...'))
            Permission.objects.all().delete()
            Role.objects.all().delete()

        self.create_permissions()
        self.create_roles()
        
        if options['update_existing_users']:
            self.assign_roles_to_existing_users()
        
        # Check for admin users and offer to create one
        admin_count = User.objects.filter(user_type='ADMIN').count()
        if admin_count == 0:
            create_admin = input('\nNo admin users found. Create default admin? (y/N): ')
            if create_admin.lower() in ['y', 'yes']:
                self.create_default_admin()
        
        self.display_summary()
        self.stdout.write(self.style.SUCCESS('\nRBAC setup completed successfully!'))
        
        # Display next steps
        self.stdout.write('\n' + self.style.WARNING('NEXT STEPS:'))
        self.stdout.write('1. If you created a default admin, CHANGE THE PASSWORD immediately')
        self.stdout.write('2. Review and adjust role permissions as needed')
        self.stdout.write('3. Test the permission system with different user types')
        self.stdout.write('4. Run migrations if you made model changes')
        self.stdout.write('5. Restart your application server')