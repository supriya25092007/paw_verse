from django.conf import settings
from django.db import models


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vet_bookings")
    pet = models.ForeignKey("pets.Pet", on_delete=models.CASCADE, related_name="vet_bookings")
    veterinarian = models.ForeignKey("veterinary.VetProfile", on_delete=models.PROTECT, related_name="bookings")
    scheduled_at = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("scheduled_at",)
