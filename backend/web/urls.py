from django.urls import path
from .views import CallsRecordView, BulkCallsCreateView

app_name = "web"

urlpatterns = [
    path("calls/create/", CallsRecordView.as_view(), name="callrecord_create"),
    path("calls/bulk_create/", BulkCallsCreateView.as_view(), name="callrecord_bulk_create"),
]
