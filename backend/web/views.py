from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db import transaction
from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CallRecord
from .serializers import CallRecordSerializer
from rest_framework.permissions import IsAuthenticated
from UserAuth.auth import InMemoryTokenAuthentication

class BulkCallsCreateView(APIView):
    authentication_classes = [InMemoryTokenAuthentication]
    permission_classes = [IsAuthenticated]
    def post(self, request):
        records = request.data.get("records")
        if not isinstance(records, list):
            return Response({"detail": "records должен быть списком"}, status=status.HTTP_400_BAD_REQUEST)
        errors = []
        instances = []
        for idx, rec in enumerate(records):
            line = idx + 1
            line_errors = []
            calldate = rec.get("calldate")
            src = rec.get("src")
            dst = rec.get("dst")
            duration = rec.get("duration")
            billsec = rec.get("billsec")
            disposition = rec.get("disposition", "")

            if not calldate:
                line_errors.append("calldate пустой")
            else:
                dt = parse_datetime(calldate)
                if dt is None:
                    dt = parse_datetime(str(calldate).replace(" ", "T"))
                if dt is None:
                    line_errors.append("Неверный формат calldate")
                else:
                    if timezone.is_naive(dt):
                        dt = timezone.make_aware(dt, timezone.get_current_timezone())

            if not src:
                line_errors.append("src пустой")
            elif len(str(src)) > 64:
                line_errors.append("src слишком длинный")

            if not dst:
                line_errors.append("dst пустой")
            elif len(str(dst)) > 64:
                line_errors.append("dst слишком длинный")

            try:
                d = int(duration)
                if d < 0:
                    line_errors.append("duration < 0")
            except Exception:
                line_errors.append("duration должен быть целым числом")

            try:
                b = int(billsec)
                if b < 0:
                    line_errors.append("billsec < 0")
            except Exception:
                line_errors.append("billsec должен быть целым числом")

            if not disposition:
                line_errors.append("disposition пустой")

            if line_errors:
                errors.append({"line": line, "errors": line_errors})
            else:
                disp = str(disposition).strip().lower()
                if disp == "answered" or "answered" in disp:
                    norm_disp = CallRecord.ANSWERED
                    answered_flag = True
                elif disp == "no answer" or "no answer" in disp or "noanswer" in disp:
                    norm_disp = CallRecord.NO_ANSWER
                    answered_flag = False
                else:
                    norm_disp = CallRecord.OTHER
                    answered_flag = False

                instances.append(
                    CallRecord(
                        calldate=dt,
                        src=str(src).strip(),
                        dst=str(dst).strip(),
                        duration=int(duration),
                        billsec=int(billsec),
                        disposition=norm_disp,
                        answered=answered_flag,
                    )
                )

        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            CallRecord.objects.bulk_create(instances)

        return Response({"created": len(instances)}, status=status.HTTP_201_CREATED)
