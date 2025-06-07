from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import BehavioralAnalyzer
from .models import BehavioralBiometrics
from datetime import datetime
from .serializers import BehavioralDataSerializer

class SubmitBehavioralDataView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BehavioralDataSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # data = request.data  # expects 'typing' and 'mouse' keys
        analyzer = BehavioralAnalyzer()
        score = analyzer.analyze_behavior(request.user, {
            'ip': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'timestamp': datetime.now().isoformat(),
            # 'typing': data.get('typing', {}),
            # 'mouse': data.get('mouse', {})
            'typing': serializer.validated_data.get('typing', {}),
            'mouse': serializer.validated_data.get('mouse', {})
        })
        return Response({'confidence_score': score})
