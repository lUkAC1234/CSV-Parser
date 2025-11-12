from rest_framework import serializers
from .models import CallRecord

class CallRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallRecord
        fields = ["id", "calldate", "src", "dst", "duration", "billsec"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["disposition"] = CallRecord.NO_ANSWER
        validated_data["answered"] = False
        return super().create(validated_data)
