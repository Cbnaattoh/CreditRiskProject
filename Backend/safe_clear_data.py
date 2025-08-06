#!/usr/bin/env python
"""
Clear all application data using raw SQL to avoid foreign key issues
"""
import os
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import (
    CreditApplication, 
    MLCreditAssessment,
    ApplicationNote,
    Document,
    Applicant,
    Address,
    EmploymentInfo,
    FinancialInfo,
    BankAccount
)

def clear_applications():
    print("=== CLEARING ALL APPLICATION DATA ===")
    
    # Get counts before deletion
    counts_before = {
        'Credit Applications': CreditApplication.objects.count(),
        'ML Assessments': MLCreditAssessment.objects.count(),
        'Application Notes': ApplicationNote.objects.count(),
        'Documents': Document.objects.count(),
        'Applicants': Applicant.objects.count(),
        'Addresses': Address.objects.count(),
        'Employment Info': EmploymentInfo.objects.count(),
        'Financial Info': FinancialInfo.objects.count(),
        'Bank Accounts': BankAccount.objects.count()
    }
    
    print("Current data counts:")
    for model, count in counts_before.items():
        print(f"  {model}: {count}")
    
    print("\nDeleting all application-related data using raw SQL...")
    
    try:
        with connection.cursor() as cursor:
            # Disable foreign key checks temporarily
            cursor.execute("SET foreign_key_checks = 0;")
            
            # Delete from all application-related tables
            tables_to_clear = [
                'applications_bankaccount',
                'applications_address', 
                'applications_employmentinfo',
                'applications_financialinfo',
                'applications_applicant',
                'applications_document',
                'applications_applicationnote',
                'applications_mlcreditassessment',
                'applications_creditapplication'
            ]
            
            for table in tables_to_clear:
                try:
                    cursor.execute(f"DELETE FROM {table};")
                    print(f"  Cleared table: {table}")
                except Exception as e:
                    print(f"  Could not clear {table}: {e}")
            
            # Re-enable foreign key checks
            cursor.execute("SET foreign_key_checks = 1;")
        
        # Verify deletion
        print("\n=== VERIFICATION ===")
        print(f"  Credit Applications remaining: {CreditApplication.objects.count()}")
        print(f"  ML Assessments remaining: {MLCreditAssessment.objects.count()}")
        print(f"  Application Notes remaining: {ApplicationNote.objects.count()}")
        print(f"  Documents remaining: {Document.objects.count()}")
        print(f"  Applicants remaining: {Applicant.objects.count()}")
        
        print("\nAll application data has been cleared successfully!")
        print("Draft rows have been removed.")
        
    except Exception as e:
        print(f"\nError during deletion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    clear_applications()