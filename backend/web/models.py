from django.db import models
from django.utils import timezone


class CallRecord(models.Model):
    ANSWERED = "ANSWERED"
    NO_ANSWER = "NO ANSWER"
    OTHER = "OTHER"

    DISPOSITION_CHOICES = (
        (ANSWERED, "Answered"),
        (NO_ANSWER, "No Answer"),
        (OTHER, "Other"),
    )

    calldate = models.DateTimeField()
    src = models.CharField("src", max_length=64, db_index=True)
    dst = models.CharField("dst", max_length=64, db_index=True)
    duration = models.PositiveIntegerField("duration", default=0)
    billsec = models.PositiveIntegerField("billsec", default=0)
    disposition = models.CharField(
        "disposition",
        max_length=32,
        choices=DISPOSITION_CHOICES,
        default=NO_ANSWER,
    )
    answered = models.BooleanField("answered", default=False)
    created_at = models.DateTimeField("created_at", auto_now_add=True)
    updated_at = models.DateTimeField("updated_at", auto_now=True)

    class Meta:
        verbose_name = "Call record"
        verbose_name_plural = "Call records"
        ordering = ("-calldate",)

    def __str__(self):
        return f"{self.calldate} — {self.src} → {self.dst} ({self.disposition})"

    def save(self, *args, **kwargs):
        if self.disposition:
            disp_lower = self.disposition.strip().lower()
            if disp_lower == "answered":
                self.disposition = self.ANSWERED
                self.answered = True
            elif disp_lower == "no answer":
                self.disposition = self.NO_ANSWER
                self.answered = False
            elif disp_lower == self.NO_ANSWER.lower():
                self.disposition = self.NO_ANSWER
                self.answered = False
            else:
                self.disposition = self.OTHER
                self.answered = False

        if self.calldate and timezone.is_naive(self.calldate):
            self.calldate = timezone.make_aware(
                self.calldate, timezone.get_current_timezone()
            )

        super().save(*args, **kwargs)
