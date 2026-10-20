from django.conf import settings
from django.db import models


class RescueCase(models.Model):
    class Status(models.TextChoices):
        REPORTED = "reported", "Reported"
        ASSIGNED = "assigned", "Assigned"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rescue_cases")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_rescue_cases")
    pet = models.ForeignKey("pets.Pet", null=True, blank=True, on_delete=models.SET_NULL, related_name="rescue_cases")
    description = models.TextField()
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.REPORTED)
    created_at = models.DateTimeField(auto_now_add=True)


class Volunteer(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="volunteer_profiles")
    rescue_case = models.ForeignKey(RescueCase, on_delete=models.CASCADE, related_name="volunteers")
    message = models.TextField(blank=True)
    approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("user", "rescue_case"), name="unique_rescue_volunteer")]
