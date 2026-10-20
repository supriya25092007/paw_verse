from django.conf import settings
from django.db import models


class Listing(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        PENDING = "pending", "Pending"
        ADOPTED = "adopted", "Adopted"
        CLOSED = "closed", "Closed"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="adoption_listings")
    pet = models.ForeignKey("pets.Pet", on_delete=models.CASCADE, related_name="adoption_listings")
    contact_number = models.CharField(max_length=32, blank=True)
    description = models.TextField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)


class Application(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"

    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="adoption_applications")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="applications")
    contact_number = models.CharField(max_length=32, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("applicant", "listing"), name="unique_adoption_application")]
