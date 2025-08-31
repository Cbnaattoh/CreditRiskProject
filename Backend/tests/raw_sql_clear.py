#!/usr/bin/env python
"""
Clear all application data using raw SQL DELETE commands
"""
import os
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def clear_applications():
    print("=== CLEARING ALL APPLICATION DATA WITH RAW SQL ===")
    
    try:
        with connection.cursor() as cursor:
            # First, let's see what tables exist
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%application%' OR table_name LIKE '%document%';
            """)
            tables = cursor.fetchall()
            print("Relevant tables found:")
            for table in tables:
                print(f"  - {table[0]}")
            
            print("\nDeleting from application tables in correct order...")
            
            # Delete in order to avoid foreign key constraints
            delete_queries = [
                "DELETE FROM applications_mlcreditassessment;",
                "DELETE FROM applications_applicationnote;", 
                "DELETE FROM applications_document;",
                "DELETE FROM applications_bankaccount;",
                "DELETE FROM applications_address;",
                "DELETE FROM applications_employmentinfo;",
                "DELETE FROM applications_financialinfo;",
                "DELETE FROM applications_applicant;",
                "DELETE FROM applications_creditapplication;"
            ]
            
            for query in delete_queries:
                try:
                    cursor.execute(query)
                    rows_affected = cursor.rowcount
                    table_name = query.split(' FROM ')[1].rstrip(';')
                    if rows_affected > 0:
                        print(f"  Deleted {rows_affected} rows from {table_name}")
                except Exception as e:
                    table_name = query.split(' FROM ')[1].rstrip(';')
                    print(f"  Could not delete from {table_name}: {e}")
        
        # Verify with Django ORM
        from applications.models import CreditApplication, Document, Applicant
        
        print("\n=== VERIFICATION ===")
        print(f"  Credit Applications remaining: {CreditApplication.objects.count()}")
        print(f"  Documents remaining: {Document.objects.count()}")
        print(f"  Applicants remaining: {Applicant.objects.count()}")
        
        print("\nAll application data has been cleared successfully!")
        print("Draft rows and all other application data have been removed.")
        
    except Exception as e:
        print(f"\nError during deletion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    clear_applications()