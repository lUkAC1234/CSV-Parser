from rest_framework.generics import CreateAPIView
from .models import CallRecord
from .serializers import CallRecordSerializer

class CallsRecordView(CreateAPIView):
    queryset = CallRecord.objects.all()
    serializer_class = CallRecordSerializer