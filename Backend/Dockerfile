# FROM python:3.12-slim

# WORKDIR /app

# # Install only what's needed for Celery to run
# COPY requirements.docker.txt .
# RUN pip install --no-cache-dir -r requirements.docker.txt

# # Copy Django project structure
# COPY backend/ backend/
# COPY ai/ ai/
# COPY api/ api/
# COPY applications/ applications/
# COPY config/ config/
# COPY documents/ documents/
# COPY integrations/ integrations/
# COPY ml_model/ ml_model/
# COPY ml_api/ ml_api/
# COPY notifications/ notifications/
# COPY reports/ reports/
# COPY risk/ risk/
# COPY security/ security/
# COPY users/ users/
# COPY manage.py .

# # Create required directories
# RUN mkdir -p logs

# # Set Python path so imports work
# ENV PYTHONPATH=/app

# CMD ["celery", "-A", "backend", "worker", "--loglevel=info"]
