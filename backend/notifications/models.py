from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Channel(models.TextChoices):
        IN_APP = "in_app", "In app"
        SMS = "sms", "SMS"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    channel = models.CharField(max_length=8, choices=Channel.choices, default=Channel.IN_APP)
    title = models.CharField(max_length=160)
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
