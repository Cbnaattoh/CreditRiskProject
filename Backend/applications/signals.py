"""
Django signals for automatic ML credit assessment generation
"""
import logging
import sys
import os
import time
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CreditApplication, MLCreditAssessment, ApplicationNote

# Create specialized logger for ML operations
ml_logger = logging.getLogger('applications.signals')
ml_logger.setLevel(logging.DEBUG)

# Add ML model path to Python path
ml_model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_model')
if ml_model_path not in sys.path:
    sys.path.append(ml_model_path)

@receiver(post_save, sender=CreditApplication)
def auto_generate_ml_assessment(sender, instance, created, **kwargs):
    """
    Automatically generate ML credit assessment when application status changes to SUBMITTED
    """
    # Only trigger for SUBMITTED applications that don't already have ML assessment
    if instance.status == 'SUBMITTED' and not hasattr(instance, 'ml_assessment'):
        ml_logger.info("=" * 80)
        ml_logger.info("🤖 ML MODEL AUTO-TRIGGER ACTIVATED")
        ml_logger.info("=" * 80)
        ml_logger.info(f"📋 Application ID: {instance.id}")
        ml_logger.info(f"👤 Applicant: {instance.applicant.email if instance.applicant else 'Unknown'}")
        ml_logger.info(f"📊 Status: {instance.status}")
        ml_logger.info(f"💰 Loan Amount: ${instance.loan_amount or 0:,.2f}")
        ml_logger.info(f"💼 Job Title: '{instance.job_title}' (empty={not instance.job_title})")
        
        try:
            start_time = time.time()
            
            # Check if ML assessment already exists (safety check)
            if MLCreditAssessment.objects.filter(application=instance).exists():
                ml_logger.warning(f"⚠️  ML assessment already exists for application {instance.id} - skipping")
                return
            
            ml_logger.info("🔄 Starting ML credit score generation...")
            result = _generate_credit_score_for_application(instance)
            
            total_time = time.time() - start_time
            
            if result.get('success'):
                ml_logger.info("✅ ML ASSESSMENT COMPLETED SUCCESSFULLY")
                ml_logger.info(f"📊 Credit Score: {result['credit_score']}")
                ml_logger.info(f"🎯 Category: {result['category']}")
                ml_logger.info(f"⚡ Risk Level: {result['risk_level']}")
                ml_logger.info(f"🔍 Confidence: {result['confidence']}%")
                ml_logger.info(f"⏱️  Total Processing Time: {total_time:.2f}s")
            else:
                ml_logger.error(f"❌ ML assessment failed: {result.get('error')}")
            
            ml_logger.info("=" * 80)
            
        except Exception as e:
            ml_logger.error("❌ CRITICAL ERROR IN ML ASSESSMENT")
            ml_logger.error(f"Error: {str(e)}")
            import traceback
            ml_logger.error(f"Traceback:\n{traceback.format_exc()}")
            ml_logger.info("=" * 80)

def _generate_credit_score_for_application(application):
    """
    Generate credit score using ML model for an application
    This is the same logic as in ApplicationSubmitView._generate_credit_score
    """
    try:
        # Import ML model components
        ml_logger.debug("🔧 Loading ML model components...")
        try:
            from src.credit_scorer import get_credit_scorer
            ml_logger.debug("✅ ML model components loaded successfully")
        except ImportError as e:
            ml_logger.error(f'❌ ML model not available during auto-generation: {str(e)}')
            return {'success': False, 'error': 'ML model not available'}
        
        # Fix job title issue: Get from employment info if main job_title is empty
        job_title = application.job_title
        ml_logger.debug(f"🏷️  Initial job title: '{job_title}'")
        
        if not job_title:
            ml_logger.debug("🔍 Job title empty, checking multiple sources...")
            
            # Strategy 1: Try to get from applicant_info -> employment_history
            try:
                if hasattr(application, 'applicant_info') and application.applicant_info:
                    applicant = application.applicant_info
                    employment = applicant.employment_history.first()
                    if employment and employment.job_title:
                        job_title = employment.job_title
                        # Update the main job_title field for future use
                        application.job_title = job_title
                        application.save()
                        ml_logger.info(f"✅ Fixed job title mapping from applicant_info: '{job_title}'")
                    else:
                        ml_logger.debug("📭 Applicant has no employment history with job title")
                else:
                    ml_logger.debug("📭 No applicant_info found on application")
            except Exception as e:
                ml_logger.debug(f"📝 Could not fetch from applicant_info: {str(e)}")
            
            # Strategy 2: Try to find employment info directly linked to this application
            if not job_title:
                try:
                    from applications.models import EmploymentInfo, Applicant
                    # Find applicant record for this application
                    applicant = Applicant.objects.filter(application=application).first()
                    if applicant:
                        employment = EmploymentInfo.objects.filter(applicant=applicant).first()
                        if employment and employment.job_title:
                            job_title = employment.job_title
                            application.job_title = job_title
                            application.save()
                            ml_logger.info(f"✅ Fixed job title mapping from direct query: '{job_title}'")
                        else:
                            ml_logger.debug("📭 No employment records found via direct query")
                    else:
                        ml_logger.debug("📭 No applicant record found for this application")
                except Exception as e:
                    ml_logger.debug(f"📝 Could not fetch via direct query: {str(e)}")
            
            # Strategy 3: Use a reasonable default if still no job title
            if not job_title:
                job_title = 'Other'
                ml_logger.info(f"🔧 Using default job title: '{job_title}' (no employment info available)")
        else:
            ml_logger.debug(f"✅ Using existing job title: '{job_title}'")
        
        # Prepare data for ML model
        ml_logger.info("🧮 Preparing ML input data...")
        ml_data = {
            'annual_inc': float(application.annual_income or 0),
            'dti': float(application.debt_to_income_ratio or 12.0),  # Default reasonable value
            'int_rate': float(application.interest_rate or 15.0),
            'revol_util': float(application.revolving_utilization or 30.0),
            'delinq_2yrs': int(application.delinquencies_2yr or 0),
            'inq_last_6mths': int(application.inquiries_6mo or 1),
            'emp_length': application.employment_length or '< 1 year',
            'emp_title': job_title or 'Other',
            'open_acc': int(application.open_accounts or 5),
            'collections_12_mths_ex_med': int(application.collections_12mo or 0),
            'loan_amnt': float(application.loan_amount or 0),
            'credit_history_length': float(application.credit_history_length or 1.0),
            'max_bal_bc': float(application.max_bankcard_balance or 1000.0),
            'total_acc': int(application.total_accounts or 8),
            'open_rv_12m': int(application.revolving_accounts_12mo or 2),
            'pub_rec': int(application.public_records or 0),
            'home_ownership': application.home_ownership or 'RENT'
        }
        
        # Log the prepared ML data in a formatted way
        ml_logger.info("📋 ML INPUT DATA:")
        ml_logger.info(f"   💰 Annual Income: ${ml_data['annual_inc']:,.2f}")
        ml_logger.info(f"   💳 Debt-to-Income: {ml_data['dti']}%")
        ml_logger.info(f"   📊 Interest Rate: {ml_data['int_rate']}%")
        ml_logger.info(f"   🔄 Revolving Utilization: {ml_data['revol_util']}%")
        ml_logger.info(f"   💼 Job: '{ml_data['emp_title']}'")
        ml_logger.info(f"   ⏳ Employment Length: {ml_data['emp_length']}")
        ml_logger.info(f"   🏠 Home Ownership: {ml_data['home_ownership']}")
        ml_logger.info(f"   💸 Loan Amount: ${ml_data['loan_amnt']:,.2f}")
        ml_logger.info(f"   🏦 Total Accounts: {ml_data['total_acc']}")
        ml_logger.info(f"   📅 Credit History: {ml_data['credit_history_length']} years")
        
        # Get ML prediction
        ml_logger.info("🤖 Initializing ML model scorer...")
        scorer = get_credit_scorer()
        ml_logger.info("⚡ Running ML model prediction...")
        
        prediction_start = time.time()
        result = scorer.predict_credit_score(ml_data)
        prediction_time = time.time() - prediction_start
        
        ml_logger.info(f"📊 ML prediction completed in {prediction_time:.3f}s")
        
        if result['success']:
            ml_logger.info("🎯 ML PREDICTION RESULTS:")
            ml_logger.info(f"   📈 Credit Score: {result['credit_score']}")
            ml_logger.info(f"   🏷️  Category: {result['category']}")
            ml_logger.info(f"   ⚠️  Risk Level: {result['risk_level']}")
            ml_logger.info(f"   🎯 Confidence: {result['confidence']}%")
            ml_logger.info(f"   🇬🇭 Ghana Job Category: {result.get('job_category', 'N/A')}")
            ml_logger.info(f"   📊 Model Version: {result.get('model_version', 'Unknown')}")
            
            # Store prediction result in MLCreditAssessment model
            ml_logger.info("💾 Saving ML assessment to database...")
            processing_time = int(prediction_time * 1000)  # Convert to milliseconds
            
            ml_assessment, created = MLCreditAssessment.objects.update_or_create(
                application=application,
                defaults={
                    'credit_score': result['credit_score'],
                    'category': result['category'],
                    'risk_level': result['risk_level'],
                    'confidence': result['confidence'],
                    'ghana_job_category': result.get('job_category', 'Other'),
                    'ghana_employment_score': result.get('employment_score', 50.0),
                    'ghana_job_stability_score': result.get('job_stability_score', 50),
                    'model_version': result.get('model_version', '2.0.0'),
                    'confidence_factors': result.get('confidence_factors', {}),
                    'processing_time_ms': processing_time,
                    'features_used': list(ml_data.keys())
                }
            )
            
            action = "Created" if created else "Updated"
            ml_logger.info(f"✅ {action} ML assessment record in database")
            
            # Create audit trail note
            ml_logger.debug("📝 Creating audit trail note...")
            note_content = f"""Automatic ML Credit Score Generation:
- {action} ML assessment via Django signal
- Credit Score: {result['credit_score']} ({result['category']})
- Risk Level: {result['risk_level']}
- Confidence: {result['confidence']}%
- Ghana Job: {job_title or 'Other'}
- Model Version: {result.get('model_version', '2.0.0')}
- Processing Time: {processing_time}ms
- Generated automatically when status changed to SUBMITTED"""
            
            ApplicationNote.objects.create(
                application=application,
                author=application.applicant,
                note=note_content,
                is_internal=True
            )
            
            ml_logger.debug("✅ Audit trail note created")
            ml_logger.info(f"🏁 Auto-generated ML credit score for application {application.id}: {result['credit_score']}")
            
            return {
                'success': True,
                'credit_score': result['credit_score'],
                'category': result['category'],
                'risk_level': result['risk_level'],
                'confidence': result['confidence'],
                'model_version': result.get('model_version', '2.0.0')
            }
        else:
            ml_logger.error(f"❌ ML prediction failed for application {application.id}")
            ml_logger.error(f"Error details: {result.get('error')}")
            return {
                'success': False,
                'error': result.get('error', 'Prediction failed')
            }
    
    except Exception as e:
        ml_logger.error(f"💥 EXCEPTION in credit score generation for application {application.id}")
        ml_logger.error(f"Exception: {str(e)}")
        import traceback
        ml_logger.error(f"Full traceback:\n{traceback.format_exc()}")
        return {
            'success': False,
            'error': f'Credit score generation failed: {str(e)}'
        }