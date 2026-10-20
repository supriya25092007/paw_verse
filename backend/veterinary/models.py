from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class VetProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vet_profile")
    clinic_name = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True, default="")
    contact_number = models.CharField(max_length=32, blank=True)
    specialization = models.CharField(max_length=120)
    license_number = models.CharField(max_length=80, unique=True, null=True, blank=True)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} ({self.specialization})"


class Clinic(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="clinics")
    name = models.CharField(max_length=180)
    address = models.TextField()
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    opening_hours = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)


class Appointment(models.Model):
    pet = models.ForeignKey("pets.Pet", on_delete=models.CASCADE)
    vet = models.ForeignKey(VetProfile, on_delete=models.CASCADE)
    date_time = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=50, default="Pending")

    def __str__(self):
        return f"Appointment for {self.pet.name} with {self.vet.user.email}"
