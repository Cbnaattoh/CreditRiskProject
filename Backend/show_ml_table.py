#!/usr/bin/env python
"""
Show ML model output table structure and data
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from applications.models import MLCreditAssessment
from django.db import connection

def show_ml_table():
    print("=== ML MODEL OUTPUT STORAGE TABLE ===")
    
    # Show table structure
    print("\n1. TABLE STRUCTURE:")
    print("Table Name: ml_credit_assessments")
    print("Django Model: MLCreditAssessment")
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'ml_credit_assessments' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("\nColumns:")
        for col in columns:
            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
            default = f" DEFAULT {col[3]}" if col[3] else ""
            print(f"  {col[0]:<25} {col[1]:<20} {nullable}{default}")
    
    # Show field descriptions from Django model
    print("\n2. FIELD DESCRIPTIONS (from Django model):")
    model_fields = MLCreditAssessment._meta.fields
    for field in model_fields:
        help_text = getattr(field, 'help_text', '') or 'No description'
        print(f"  {field.name:<25} - {help_text}")
    
    # Show sample data
    print("\n3. SAMPLE DATA:")
    ml_records = MLCreditAssessment.objects.all()
    print(f"Total ML Assessment records: {ml_records.count()}")
    
    if ml_records.exists():
        print("\nRecent records:")
        for ml in ml_records.order_by('-prediction_timestamp')[:3]:
            print(f"\n  Application ID: {ml.application.id}")
            print(f"  Credit Score: {ml.credit_score}")
            print(f"  Category: {ml.category}")
            print(f"  Risk Level: {ml.risk_level}")
            print(f"  Confidence: {ml.confidence}%")
            print(f"  Ghana Job Category: {ml.ghana_job_category}")
            print(f"  Ghana Employment Score: {ml.ghana_employment_score}")
            print(f"  Job Stability Score: {ml.ghana_job_stability_score}")
            print(f"  Model Version: {ml.model_version}")
            print(f"  Model Accuracy: {ml.model_accuracy}%")
            print(f"  Processing Time: {ml.processing_time_ms}ms")
            print(f"  Prediction Time: {ml.prediction_timestamp}")
            print(f"  Features Used: {len(ml.features_used or [])} features")
            
            # Show confidence factors if available
            if ml.confidence_factors:
                print(f"  Confidence Breakdown:")
                for factor, data in ml.confidence_factors.items():
                    if isinstance(data, dict) and 'score' in data:
                        print(f"    - {factor}: {data['score']} ({data.get('description', 'No description')})")
    else:
        print("No ML assessment records found.")
    
    # Show which applications have ML assessments
    print("\n4. APPLICATION COVERAGE:")
    from applications.models import CreditApplication
    total_apps = CreditApplication.objects.count()
    apps_with_ml = CreditApplication.objects.filter(ml_assessment__isnull=False).count()
    print(f"Total applications: {total_apps}")
    print(f"Applications with ML assessments: {apps_with_ml}")
    print(f"Coverage: {(apps_with_ml/total_apps*100):.1f}%" if total_apps > 0 else "Coverage: 0%")

if __name__ == '__main__':
    show_ml_table()