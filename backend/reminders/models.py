from django.conf import settings
from django.db import models


class CareReminder(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        DONE = "done", "Done"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="care_reminders")
    pet = models.ForeignKey("pets.Pet", on_delete=models.CASCADE, related_name="care_reminders")
    title = models.CharField(max_length=160)
    details = models.TextField(blank=True)
    due_at = models.DateTimeField()
    recurrence = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("due_at",)
