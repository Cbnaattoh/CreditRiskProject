#!/usr/bin/env python
"""
Clear all application data from the database
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

def clear_all_applications():
    print("=== CLEARING ALL APPLICATION DATA ===")
    
    # Get counts before deletion
    print("Current data counts:")
    print(f"  Credit Applications: {CreditApplication.objects.count()}")
    print(f"  ML Assessments: {MLCreditAssessment.objects.count()}")
    print(f"  Application Notes: {ApplicationNote.objects.count()}")
    print(f"  Documents: {Document.objects.count()}")
    print(f"  Applicants: {Applicant.objects.count()}")
    print(f"  Addresses: {Address.objects.count()}")
    print(f"  Employment Info: {EmploymentInfo.objects.count()}")
    print(f"  Financial Info: {FinancialInfo.objects.count()}")
    print(f"  Bank Accounts: {BankAccount.objects.count()}")
    
    confirm = input("\nAre you sure you want to delete ALL application data? (type 'YES' to confirm): ")
    
    if confirm == 'YES':
        try:
            print("\nDeleting all application-related data...")
            
            # Delete in correct order (child tables first)
            deleted_counts = {}
            
            deleted_counts['Bank Accounts'] = BankAccount.objects.all().delete()[0]
            deleted_counts['Addresses'] = Address.objects.all().delete()[0]
            deleted_counts['Employment Info'] = EmploymentInfo.objects.all().delete()[0]
            deleted_counts['Financial Info'] = FinancialInfo.objects.all().delete()[0]
            deleted_counts['Applicants'] = Applicant.objects.all().delete()[0]
            deleted_counts['Documents'] = Document.objects.all().delete()[0]
            deleted_counts['Application Notes'] = ApplicationNote.objects.all().delete()[0]
            deleted_counts['ML Assessments'] = MLCreditAssessment.objects.all().delete()[0]
            deleted_counts['Credit Applications'] = CreditApplication.objects.all().delete()[0]
            
            print("\n=== DELETION SUMMARY ===")
            for model, count in deleted_counts.items():
                if count > 0:
                    print(f"  {model}: {count} records deleted")
            
            # Verify deletion
            print("\n=== VERIFICATION ===")
            print(f"  Credit Applications remaining: {CreditApplication.objects.count()}")
            print(f"  ML Assessments remaining: {MLCreditAssessment.objects.count()}")
            print(f"  Application Notes remaining: {ApplicationNote.objects.count()}")
            
            print("\n✅ All application data has been cleared successfully!")
            
        except Exception as e:
            print(f"\n❌ Error during deletion: {e}")
            
    else:
        print("\n❌ Deletion cancelled.")

if __name__ == '__main__':
    clear_all_applications()