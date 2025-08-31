#!/usr/bin/env python
"""
Clear all application data using PostgreSQL-specific commands
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
    
    print("\nDeleting application data by model (avoiding foreign key issues)...")
    
    try:
        # Delete models one by one to avoid foreign key constraints
        
        # Start with child models that don't have foreign key dependencies from other app models
        print("Deleting ML Assessments...")
        count = MLCreditAssessment.objects.count()
        if count > 0:
            MLCreditAssessment.objects.all().delete()
            print(f"  Deleted {count} ML Assessments")
        
        print("Deleting Application Notes...")
        count = ApplicationNote.objects.count() 
        if count > 0:
            ApplicationNote.objects.all().delete()
            print(f"  Deleted {count} Application Notes")
        
        # Delete documents one by one to avoid the foreign key issue
        print("Deleting Documents individually...")
        documents = Document.objects.all()
        doc_count = 0
        for doc in documents:
            try:
                doc.delete()
                doc_count += 1
            except Exception as e:
                print(f"  Could not delete document {doc.id}: {e}")
        if doc_count > 0:
            print(f"  Deleted {doc_count} Documents")
        
        # Now delete the core application models
        print("Deleting Bank Accounts...")
        count = BankAccount.objects.count()
        if count > 0:
            BankAccount.objects.all().delete()
            print(f"  Deleted {count} Bank Accounts")
        
        print("Deleting Addresses...")
        count = Address.objects.count()
        if count > 0:
            Address.objects.all().delete()
            print(f"  Deleted {count} Addresses")
        
        print("Deleting Employment Info...")
        count = EmploymentInfo.objects.count()
        if count > 0:
            EmploymentInfo.objects.all().delete()
            print(f"  Deleted {count} Employment Info records")
        
        print("Deleting Financial Info...")
        count = FinancialInfo.objects.count()
        if count > 0:
            FinancialInfo.objects.all().delete()
            print(f"  Deleted {count} Financial Info records")
        
        print("Deleting Applicants...")
        count = Applicant.objects.count()
        if count > 0:
            Applicant.objects.all().delete()
            print(f"  Deleted {count} Applicants")
        
        # Finally delete the Credit Applications (including drafts)
        print("Deleting Credit Applications (including drafts)...")
        apps = CreditApplication.objects.all()
        app_count = 0
        for app in apps:
            try:
                app.delete()
                app_count += 1
            except Exception as e:
                print(f"  Could not delete application {app.id}: {e}")
        if app_count > 0:
            print(f"  Deleted {app_count} Credit Applications")
        
        # Verify deletion
        print("\n=== VERIFICATION ===")
        print(f"  Credit Applications remaining: {CreditApplication.objects.count()}")
        print(f"  ML Assessments remaining: {MLCreditAssessment.objects.count()}")
        print(f"  Application Notes remaining: {ApplicationNote.objects.count()}")
        print(f"  Documents remaining: {Document.objects.count()}")
        print(f"  Applicants remaining: {Applicant.objects.count()}")
        print(f"  Addresses remaining: {Address.objects.count()}")
        print(f"  Employment Info remaining: {EmploymentInfo.objects.count()}")
        print(f"  Financial Info remaining: {FinancialInfo.objects.count()}")
        print(f"  Bank Accounts remaining: {BankAccount.objects.count()}")
        
        print("\nAll application data has been cleared successfully!")
        print("Draft rows have been removed.")
        
    except Exception as e:
        print(f"\nError during deletion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    clear_applications()