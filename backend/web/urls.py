from django.urls import path
from .views import BulkCallsCreateView

app_name = "web"

urlpatterns = [
    path("calls/bulk_create/", BulkCallsCreateView.as_view(), name="callrecord_bulk_create"),
]
