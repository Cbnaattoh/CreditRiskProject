from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import AIModelVersion, ModelTrainingLog, FeatureImportance
from .serializers import (
    AIModelVersionSerializer,
    ModelTrainingLogSerializer,
    FeatureImportanceSerializer
)

# ---------- AIModelVersion Views ----------

class AIModelVersionListCreateView(generics.ListCreateAPIView):
    queryset = AIModelVersion.objects.all().order_by('-created_at')
    serializer_class = AIModelVersionSerializer
    permission_classes = [permissions.IsAuthenticated]


class AIModelVersionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AIModelVersion.objects.all()
    serializer_class = AIModelVersionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    lookup_url_kwarg = 'pk'


# ---------- ModelTrainingLog Views ----------

class ModelTrainingLogListCreateView(generics.ListCreateAPIView):
    serializer_class = ModelTrainingLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        model_id = self.kwargs['pk']
        return ModelTrainingLog.objects.filter(model_version_id=model_id)

    def perform_create(self, serializer):
        model_version = get_object_or_404(AIModelVersion, pk=self.kwargs['pk'])
        serializer.save(model_version=model_version)


class ModelTrainingLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ModelTrainingLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    lookup_url_kwarg = 'log_pk'

    def get_queryset(self):
        model_id = self.kwargs['pk']
        return ModelTrainingLog.objects.filter(model_version_id=model_id)


# ---------- FeatureImportance Views ----------

class FeatureImportanceListCreateView(generics.ListCreateAPIView):
    serializer_class = FeatureImportanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        model_id = self.kwargs['pk']
        return FeatureImportance.objects.filter(model_version_id=model_id).order_by('-importance_score')

    def perform_create(self, serializer):
        model_version = get_object_or_404(AIModelVersion, pk=self.kwargs['pk'])
        serializer.save(model_version=model_version)


class FeatureImportanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeatureImportanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    lookup_url_kwarg = 'feature_pk'

    def get_queryset(self):
        model_id = self.kwargs['pk']
        return FeatureImportance.objects.filter(model_version_id=model_id)
