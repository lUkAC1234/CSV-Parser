from django.contrib import admin
from parler.admin import TranslatableAdmin
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
from django.utils.translation import gettext_lazy as _
from .models import CallRecord

@admin.register(CallRecord)
class CallRecordAdmin(ModelAdmin, ImportExportModelAdmin):
    list_display = ("id", "__str__", "calldate", "src", "dst", "disposition", "answered")
    list_display_links = ("id", "__str__")
    search_fields = ("src", "dst", "disposition")
    list_filter = ("disposition", "answered", "created_at")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("Основное"),
            {
                "fields": ("calldate", "src", "dst", "duration", "billsec", "disposition", "answered"),
            },
        ),
        (_("Системное"), {"fields": ("created_at", "updated_at")}), 
    )