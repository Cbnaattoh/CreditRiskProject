from celery import shared_task
from .services import RiskEngine, DecisionEngine
from applications.models import CreditApplication
from django.core.cache import cache
from django.utils import timezone

@shared_task(bind=True)
def calculate_risk_task(self, application_id):
    try:
        application = CreditApplication.objects.get(pk=application_id)
        
        # Check if another task is already running for this application
        task_id = cache.get(f'risk_task_{application_id}')
        if task_id and task_id != self.request.id:
            return f"Another task ({task_id}) is already processing this application"
        
        cache.set(f'risk_task_{application_id}', self.request.id, timeout=3600)
        
        # Calculate risk
        engine = RiskEngine()
        assessment = engine.calculate_risk(application)
        
        # Make decision
        decision_engine = DecisionEngine()
        decision = decision_engine.make_decision(application)
        
        return {
            'status': 'completed',
            'application': str(application),
            'risk_score': assessment.risk_score,
            'decision': decision.decision,
            'timestamp': timezone.now().isoformat()
        }
    except CreditApplication.DoesNotExist:
        return {'status': 'failed', 'error': 'Application not found'}
    finally:
        cache.delete(f'risk_task_{application_id}')