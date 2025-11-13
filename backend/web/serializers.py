from rest_framework import serializers
from .models import CallRecord

class CallRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallRecord
        fields = ["id", "calldate", "src", "dst", "duration", "billsec"]
        read_only_fields = ["id"]