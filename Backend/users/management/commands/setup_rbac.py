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

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting all RBAC data...'))
            Permission.objects.all().delete()
            Role.objects.all().delete()

        self.create_permissions()
        self.create_roles()
        self.assign_roles_to_users()
        
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
            
            # System Administration
            ('system_settings', 'System Settings', 'Can modify system settings'),
            ('system_logs', 'View System Logs', 'Can view system logs and audit trails'),
            ('system_backup', 'System Backup', 'Can create and manage system backups'),
            
            # Data Management
            ('data_export', 'Export Data', 'Can export data from the system'),
            ('data_import', 'Import Data', 'Can import data into the system'),
            ('data_delete', 'Delete Data', 'Can delete data from the system'),
            
            # Reporting
            ('report_view', 'View Reports', 'Can view reports and analytics'),
            ('report_create', 'Create Reports', 'Can create custom reports'),
            ('report_admin', 'Manage Reports', 'Can manage all reports and analytics'),
            
            # Risk Management (based on your user types)
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
            'Administrator': [
                # Full system access
                'user_view_all', 'user_edit_all', 'user_delete', 'user_manage_roles',
                'role_view', 'role_create', 'role_edit', 'role_delete', 'role_assign',
                'system_settings', 'system_logs', 'system_backup',
                'data_export', 'data_import', 'data_delete',
                'report_view', 'report_create', 'report_admin',
                'risk_view', 'risk_edit', 'risk_approve', 'risk_delete',
                'compliance_view', 'compliance_edit', 'compliance_audit',
                'client_view', 'client_edit', 'client_delete',
            ],
            'Risk Analyst': [
                # Risk-focused permissions
                'user_view_all',
                'risk_view', 'risk_edit', 'risk_approve',
                'compliance_view', 'compliance_edit',
                'report_view', 'report_create',
                'data_export', 'client_view',
            ],
            'Compliance Auditor': [
                # Audit-focused permissions
                'user_view_all',
                'risk_view',
                'compliance_view', 'compliance_edit', 'compliance_audit',
                'report_view', 'report_create',
                'system_logs', 'data_export',
                'client_view',
            ],
            'Client User': [
                # Limited client permissions
                'risk_view',
                'compliance_view',
                'report_view',
            ],
            'Manager': [
                # Management permissions
                'user_view_all', 'user_edit_all',
                'role_view', 'role_assign',
                'risk_view', 'risk_edit', 'risk_approve',
                'compliance_view', 'compliance_edit',
                'report_view', 'report_create', 'report_admin',
                'data_export', 'client_view', 'client_edit',
            ]
        }

        created_count = 0
        for role_name, permission_codenames in roles_permissions.items():
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': f'Default {role_name} role with predefined permissions'}
            )
            
            if created:
                created_count += 1
            
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

    def assign_roles_to_users(self):
        """Assign roles to users based on their user_type"""
        
        user_type_role_mapping = {
            'ADMIN': 'Administrator',
            'ANALYST': 'Risk Analyst',
            'AUDITOR': 'Compliance Auditor',
            'CLIENT': 'Client User',
        }

        assigned_count = 0
        for user_type, role_name in user_type_role_mapping.items():
            try:
                role = Role.objects.get(name=role_name)
                users = User.objects.filter(user_type=user_type)
                
                for user in users:
                    user_role = user.assign_role(role)
                    if user_role:
                        assigned_count += 1
                        
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Role {role_name} not found for user type {user_type}')
                )

        self.stdout.write(f'Assigned roles to {assigned_count} users')
