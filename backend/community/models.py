from django.conf import settings
from django.db import models


class Post(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_posts")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)


class LostFound(models.Model):
    class ReportType(models.TextChoices):
        LOST = "lost", "Lost"
        FOUND = "found", "Found"

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lost_found_reports")
    pet = models.ForeignKey("pets.Pet", null=True, blank=True, on_delete=models.SET_NULL, related_name="lost_found_reports")
    report_type = models.CharField(max_length=5, choices=ReportType.choices)
    description = models.TextField()
    location = models.CharField(max_length=255)
    last_seen_at = models.DateTimeField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
