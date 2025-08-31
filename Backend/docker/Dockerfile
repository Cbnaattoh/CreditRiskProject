# ============================================================================
# RiskGuard Backend - Production Docker Image
# Enterprise-grade Django application with ML capabilities
# ============================================================================

FROM python:3.11-slim-bullseye

# Metadata
LABEL maintainer="RiskGuard Development Team"
LABEL version="2.0.0"
LABEL description="Enterprise Credit Risk Management Backend"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Create application user for security
RUN groupadd -r riskguard && useradd -r -g riskguard riskguard

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    libjpeg-dev \
    libpng-dev \
    libwebp-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    tk-dev \
    tcl-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev \
    # OCR dependencies
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    libleptonica-dev \
    # OpenCV dependencies
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt requirements.docker.txt ./

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt && \
    pip install --no-deps -r requirements.docker.txt

# Create necessary directories
RUN mkdir -p /app/media /app/static /app/logs /app/ml_model/models && \
    chown -R riskguard:riskguard /app

# Copy application code
COPY --chown=riskguard:riskguard . .

# Copy ML model files (if they exist)
COPY --chown=riskguard:riskguard ml_model/models/* /app/ml_model/models/ 2>/dev/null || true

# Create supervisor startup script
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting RiskGuard Backend..."
echo "=========================================="

# Wait for database
echo "⏳ Waiting for database connection..."
python manage.py migrate --check || {
    echo "📊 Running database migrations..."
    python manage.py migrate --noinput
}

# Create superuser if not exists
echo "👤 Setting up admin user..."
python manage.py shell << 'PYTHON'
from django.contrib.auth import get_user_model
from users.models import Role, UserRole
import os

User = get_user_model()
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@riskguard.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'RiskGuard2024!')

if not User.objects.filter(email=email).exists():
    print(f"Creating superuser: {email}")
    user = User.objects.create_superuser(
        email=email,
        password=password,
        first_name='System',
        last_name='Administrator'
    )
    print("✅ Superuser created successfully")
else:
    print("✅ Superuser already exists")
PYTHON

# Set up RBAC roles
echo "🔐 Setting up RBAC system..."
python manage.py setup_rbac || echo "RBAC setup completed"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Verify ML model
echo "🤖 Verifying ML model..."
python -c "
try:
    from ml_model.src.credit_scorer import get_credit_scorer
    scorer = get_credit_scorer()
    health = scorer.health_check()
    print(f'✅ ML Model Status: {health[\"status\"]}')
    if 'accuracy' in health:
        print(f'📊 Model Accuracy: {health[\"accuracy\"]}%')
except Exception as e:
    print(f'⚠️  ML Model Warning: {e}')
    print('ℹ️  Application will run without ML features')
" || true

echo "=========================================="
echo "🎯 RiskGuard Backend Ready!"
echo "📧 Admin Email: ${DJANGO_SUPERUSER_EMAIL:-admin@riskguard.com}"
echo "🔑 Admin Password: ${DJANGO_SUPERUSER_PASSWORD:-RiskGuard2024!}"
echo "=========================================="

# Start the application
exec "$@"
EOF

RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER riskguard

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--max-requests", "1000", "--max-requests-jitter", "100", "backend.wsgi:application"]
