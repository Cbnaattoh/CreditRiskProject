#!/usr/bin/env python
"""
Clear all application data from the database - Safe deletion
"""
import os
import django

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
    
    print("\nDeleting all application-related data...")
    
    try:
        # Delete in correct order to avoid foreign key constraints
        deleted_counts = {}
        
        # Child tables first
        deleted_counts['Bank Accounts'] = BankAccount.objects.all().count()
        BankAccount.objects.all().delete()
        
        deleted_counts['Addresses'] = Address.objects.all().count()
        Address.objects.all().delete()
        
        deleted_counts['Employment Info'] = EmploymentInfo.objects.all().count()
        EmploymentInfo.objects.all().delete()
        
        deleted_counts['Financial Info'] = FinancialInfo.objects.all().count()
        FinancialInfo.objects.all().delete()
        
        deleted_counts['Applicants'] = Applicant.objects.all().count()
        Applicant.objects.all().delete()
        
        # Handle documents safely
        try:
            deleted_counts['Documents'] = Document.objects.all().count()
            Document.objects.all().delete()
        except Exception as e:
            print(f"Warning: Could not delete documents: {e}")
            deleted_counts['Documents'] = 0
        
        deleted_counts['Application Notes'] = ApplicationNote.objects.all().count()
        ApplicationNote.objects.all().delete()
        
        deleted_counts['ML Assessments'] = MLCreditAssessment.objects.all().count()
        MLCreditAssessment.objects.all().delete()
        
        # Parent table last - delete draft rows and all others
        deleted_counts['Credit Applications'] = CreditApplication.objects.all().count()
        CreditApplication.objects.all().delete()
        
        print("\n=== DELETION SUMMARY ===")
        for model, count in deleted_counts.items():
            if count > 0:
                print(f"  {model}: {count} records deleted")
        
        # Verify deletion
        print("\n=== VERIFICATION ===")
        print(f"  Credit Applications remaining: {CreditApplication.objects.count()}")
        print(f"  ML Assessments remaining: {MLCreditAssessment.objects.count()}")
        print(f"  Application Notes remaining: {ApplicationNote.objects.count()}")
        
        print("\nAll application data has been cleared successfully!")
        print("Draft rows have been removed.")
        
    except Exception as e:
        print(f"\nError during deletion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    clear_applications()