from django.urls import path
from .views import (
    CallsRecordView,
)

app_name = "web"

urlpatterns = [
    path("calls/create/", CallsRecordView.as_view(), name="callrecord_create"),
]