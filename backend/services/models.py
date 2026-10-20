from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Service(models.Model):
    class Kind(models.TextChoices):
        GROOMING = "grooming", "Grooming"
        SITTING = "sitting", "Sitting"

    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="services")
    kind = models.CharField(max_length=12, choices=Kind.choices)
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Grooming(models.Model):
    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name="grooming_details")
    duration_minutes = models.PositiveSmallIntegerField()
    includes_bath = models.BooleanField(default=False)


class Sitting(models.Model):
    service = models.OneToOneField(Service, on_delete=models.CASCADE, related_name="sitting_details")
    overnight = models.BooleanField(default=False)
    service_area = models.CharField(max_length=160, blank=True)


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="service_bookings")
    pet = models.ForeignKey("pets.Pet", on_delete=models.CASCADE, related_name="service_bookings")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="bookings")
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
