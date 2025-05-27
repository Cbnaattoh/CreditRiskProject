from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import BehavioralAnalyzer
from .models import BehavioralBiometrics
from datetime import datetime

class SubmitBehavioralDataView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data  # expects 'typing' and 'mouse' keys
        analyzer = BehavioralAnalyzer()
        score = analyzer.analyze_behavior(request.user, {
            'ip': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'timestamp': datetime.now().isoformat(),
            'typing': data.get('typing', {}),
            'mouse': data.get('mouse', {})
        })
        return Response({'confidence_score': score})
