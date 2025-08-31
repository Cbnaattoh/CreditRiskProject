# Automated ML Pipeline Setup Guide

## Overview
This automated ML pipeline triggers machine learning credit assessments when applications are submitted or updated. It uses Django signals and Celery background tasks to process applications efficiently.

## Architecture

```
Application Submission/Update
        ↓
Django Signals (applications/signals.py)
        ↓
Celery Background Task (applications/tasks.py)
        ↓
ML Credit Scorer (ml_model/src/credit_scorer.py)
        ↓
Ghana Employment Processor (ml_model/ghana_employment_processor.py)
        ↓
Database Storage (MLCreditAssessment model)
        ↓
Notifications (for assigned analysts)
```

## Components Added

### 1. Celery Configuration (`backend/celery.py`)
- Celery app configuration
- Task serialization and error handling
- Queue management

### 2. Django Signals (`applications/signals.py`)
- `trigger_ml_assessment_on_submission`: Triggers ML processing on application submission
- `cache_previous_ml_data`: Caches previous data to detect significant changes
- `_has_ml_relevant_changes`: Detects if changes warrant ML reprocessing
- Manual trigger functions for API/admin use

### 3. Celery Tasks (`applications/tasks.py`)
- `process_ml_credit_assessment`: Main ML processing task with retry logic
- `batch_process_ml_assessments`: Batch processing for multiple applications
- `cleanup_stale_ml_processing_locks`: Maintenance task for stuck processes

### 4. Enhanced Database Model
New fields added to `MLCreditAssessment`:
```python
processing_status = CharField  # PENDING, PROCESSING, COMPLETED, FAILED, RETRYING
processing_error = TextField   # Error messages
retry_count = IntegerField     # Number of retries
last_updated = DateTimeField   # Last update timestamp
```

### 5. API Endpoints (`applications/views.py` & `urls.py`)
- `POST /applications/{id}/ml-assessment/trigger/` - Manual ML trigger
- `GET /applications/{id}/ml-assessment/status/` - Check assessment status  
- `POST /applications/ml-assessments/batch-trigger/` - Batch processing
- `GET /applications/ml-assessments/statistics/` - Processing statistics

### 6. Management Command (`applications/management/commands/process_ml_assessments.py`)
```bash
# Process specific application
python manage.py process_ml_assessments --application-id <uuid>

# Process all submitted applications without assessments
python manage.py process_ml_assessments --status SUBMITTED --missing-only

# Force reprocessing with dry run
python manage.py process_ml_assessments --status SUBMITTED --force --dry-run

# Monitor processing status
python manage.py process_ml_assessments --monitor

# Batch process with custom batch size
python manage.py process_ml_assessments --status SUBMITTED --batch-size 20
```

## Installation & Setup

### 1. Install Dependencies
```bash
pip install celery redis psycopg2-binary
# OR if using requirements.txt (already includes these)
pip install -r requirements.txt
```

### 2. Install and Start Redis (Celery Broker)
```bash
# On Windows using chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
# Start Redis server
redis-server
```

### 3. Database Migration
```bash
python manage.py makemigrations applications
python manage.py migrate
```

### 4. Environment Variables
Add to your `.env` file:
```bash
# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# ML Pipeline Settings
ML_PROCESSING_ENABLED=True
ML_AUTO_TRIGGER_ON_SUBMIT=True
ML_BATCH_SIZE=10
ML_RETRY_ATTEMPTS=3
ML_CONFIDENCE_THRESHOLD=0.7
GHANA_EMPLOYMENT_ANALYSIS_ENABLED=True
```

### 5. Start Celery Worker
```bash
# In a separate terminal
celery -A backend worker --loglevel=info
```

### 6. Start Django Development Server
```bash
python manage.py runserver
```

## Usage Examples

### Automatic Triggering
When a user submits an application (status changes to 'SUBMITTED'), the ML assessment will automatically trigger in the background:

```python
# This will automatically trigger ML processing
application.status = 'SUBMITTED'
application.save()
```

### Manual API Triggering
```bash
# Trigger ML assessment for specific application
curl -X POST http://localhost:8000/api/applications/{uuid}/ml-assessment/trigger/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Check assessment status
curl -X GET http://localhost:8000/api/applications/{uuid}/ml-assessment/status/ \
  -H "Authorization: Bearer {token}"

# Get processing statistics (admin only)
curl -X GET http://localhost:8000/api/applications/ml-assessments/statistics/ \
  -H "Authorization: Bearer {token}"
```

### Batch Processing
```python
from applications.signals import trigger_batch_ml_assessment

# Process multiple applications
application_ids = ['uuid1', 'uuid2', 'uuid3']
task = trigger_batch_ml_assessment(application_ids, force_reprocess=False)
result = task.get()  # Wait for completion
```

## ML Processing Flow

### 1. Data Preparation
- Extracts relevant fields from `CreditApplication`
- Validates data completeness and ranges
- Prepares input format for ML model

### 2. ML Scoring
- Uses trained XGBoost model for credit scoring
- Scales raw predictions to 300-850 credit score range
- Calculates confidence scores and risk levels

### 3. Ghana Employment Analysis
- Categorizes job titles for Ghana's economic context
- Calculates employment stability scores
- Provides localized employment insights

### 4. Database Storage
- Creates or updates `MLCreditAssessment` record
- Stores all prediction results and metadata
- Tracks processing status and errors

### 5. Notifications
- Notifies assigned analysts of completed assessments
- Includes key metrics in notification

## Monitoring & Troubleshooting

### Check Celery Worker Status
```bash
# View active workers
celery -A backend status

# Monitor task activity
celery -A backend monitor
```

### View Processing Statistics
```bash
python manage.py process_ml_assessments --monitor
```

### Common Issues

1. **ML Model Not Loading**
   - Check if model files exist in `ml_model/models/`
   - Verify file permissions
   - Check logs for import errors

2. **Celery Tasks Failing**
   - Check Redis is running
   - Verify Celery worker is active
   - Check task logs for specific errors

3. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

## Performance Considerations

### Batch Processing
- Process applications in batches of 10-50 for optimal performance
- Use batch endpoints for processing multiple applications
- Monitor memory usage during batch operations

### Caching
- ML processing locks prevent duplicate processing
- Cached data used to detect significant changes
- Clear stale locks with cleanup task

### Monitoring
- Track processing times and success rates
- Monitor failed assessments for patterns
- Use statistics endpoint for real-time metrics

## Security Features

- Permission checks (only admins/analysts can trigger)
- Input validation and sanitization
- Error handling with sensitive data protection
- Processing locks prevent race conditions
- Retry logic with exponential backoff

## Ghana Employment Features

The system includes specialized analysis for Ghana's employment landscape:

- **18 Job Categories**: Banking & Finance, Mining & Energy, Government, etc.
- **Stability Scoring**: 0-100 scale based on job security in Ghana
- **Income Expectations**: Localized salary ranges in Ghana Cedis
- **Risk Assessment**: Employment-based risk evaluation

## Future Enhancements

- Real-time WebSocket notifications
- A/B testing for model versions
- Advanced monitoring dashboard
- Scheduled batch processing
- Model performance tracking
- Auto-scaling for high volumes

## Testing

### Unit Tests
```bash
python manage.py test applications.tests.test_ml_pipeline
```

### Integration Tests
```bash
# Test full pipeline with sample data
python manage.py test applications.tests.test_ml_integration
```

### Load Testing
```bash
# Process multiple applications
python manage.py process_ml_assessments --status SUBMITTED --batch-size 100
```

This automated ML pipeline provides robust, scalable credit assessment processing with comprehensive error handling, monitoring, and Ghana-specific employment analysis.