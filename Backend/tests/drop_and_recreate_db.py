#!/usr/bin/env python3
"""
Drop and Recreate Database Script
================================

Fast database reset by dropping and recreating the entire database.
Much faster than deleting individual records.

Usage:
    python drop_and_recreate_db.py --confirm
    python drop_and_recreate_db.py --dry-run

Author: Generated for RiskGuard Pro
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import argparse
from datetime import datetime

# Add the Backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# Change to Backend directory
original_dir = os.getcwd()
os.chdir(backend_dir)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    import django
    django.setup()
    from django.conf import settings
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    os.chdir(original_dir)
    sys.exit(1)

def get_db_config():
    """Get database configuration from Django settings"""
    return {
        'host': settings.DATABASES['default'].get('HOST', 'localhost'),
        'port': settings.DATABASES['default'].get('PORT', 5432),
        'user': settings.DATABASES['default']['USER'],
        'password': settings.DATABASES['default']['PASSWORD'],
        'database': settings.DATABASES['default']['NAME']
    }

def drop_and_recreate_database(dry_run=False):
    """Drop and recreate the database"""
    print("=" * 60)
    print("DATABASE DROP AND RECREATE")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    print(f"Dry run mode: {dry_run}")
    print("=" * 60)
    
    db_config = get_db_config()
    
    print(f"Database: {db_config['database']}")
    print(f"Host: {db_config['host']}")
    print(f"Port: {db_config['port']}")
    print(f"User: {db_config['user']}")
    
    if dry_run:
        print("\n[DRY RUN] Would execute the following operations:")
        print(f"1. Connect to PostgreSQL server")
        print(f"2. DROP DATABASE {db_config['database']}")
        print(f"3. CREATE DATABASE {db_config['database']}")
        print(f"4. Run Django migrations")
        return True
    
    try:
        # Connect to PostgreSQL server (not the specific database)
        print(f"\nConnecting to PostgreSQL server...")
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database='postgres'  # Connect to default postgres database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Terminate all connections to the target database
        print(f"Terminating connections to database '{db_config['database']}'...")
        cursor.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{db_config['database']}'
            AND pid <> pg_backend_pid()
        """)
        
        # Drop the database
        print(f"Dropping database '{db_config['database']}'...")
        cursor.execute(f'DROP DATABASE IF EXISTS "{db_config['database']}"')
        print("✅ Database dropped successfully!")
        
        # Create the database
        print(f"Creating database '{db_config['database']}'...")
        cursor.execute(f'CREATE DATABASE "{db_config['database']}" OWNER "{db_config['user']}"')
        print("✅ Database created successfully!")
        
        cursor.close()
        conn.close()
        
        # Run Django migrations
        print("\nRunning Django migrations...")
        os.system("python manage.py migrate")
        print("✅ Migrations completed!")
        
        # Set up RBAC system (roles, permissions)
        print("\nSetting up RBAC system (roles and permissions)...")
        os.system("python manage.py setup_rbac")
        print("✅ RBAC setup completed!")
        
        print("\n" + "=" * 60)
        print("✅ DATABASE RESET COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Completed at: {datetime.now()}")
        print("The database is now clean with:")
        print("✓ Fresh schema (migrations)")
        print("✓ Complete RBAC system (roles & permissions)")
        print("✓ Ready for superuser creation")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Command line interface"""
    parser = argparse.ArgumentParser(
        description="Drop and recreate the database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python drop_and_recreate_db.py --dry-run
  python drop_and_recreate_db.py --confirm
        """
    )
    
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be done without actually doing it')
    parser.add_argument('--confirm', action='store_true',
                       help='Confirm the destructive operation')
    
    args = parser.parse_args()
    
    if not args.dry_run and not args.confirm:
        print("❌ ERROR: This will completely destroy the database!")
        print("Use --dry-run to see what would happen, or --confirm to proceed.")
        print("Example: python drop_and_recreate_db.py --confirm")
        return
    
    # Final confirmation for actual operation
    if not args.dry_run:
        print("⚠️  WARNING: This will COMPLETELY DESTROY the database!")
        print("All data will be permanently lost!")
        response = input("Type 'DESTROY DATABASE' to confirm: ")
        if response != 'DESTROY DATABASE':
            print("❌ Operation cancelled.")
            return
    
    success = drop_and_recreate_database(args.dry_run)
    
    # Restore original directory
    os.chdir(original_dir)
    
    if success:
        print("\n🎉 Success! Database has been reset.")
        if not args.dry_run:
            print("You can now create a superuser with:")
            print("python manage.py createsuperuser")
    else:
        print("\n❌ Operation failed. Check error messages above.")
        sys.exit(1)

if __name__ == '__main__':
    main()