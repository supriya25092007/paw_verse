from django.conf import settings
from django.db import models


class Vaccination(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vaccinations")
    pet = models.ForeignKey("pets.Pet", on_delete=models.CASCADE, related_name="vaccinations")
    name = models.CharField(max_length=120)
    administered_on = models.DateField()
    next_due_on = models.DateField(null=True, blank=True)
    veterinarian = models.ForeignKey(
        "veterinary.VetProfile", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="vaccinations",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-administered_on",)


class MedicalHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="medical_histories")
    pet = models.ForeignKey("pets.Pet", on_delete=models.CASCADE, related_name="medical_history")
    title = models.CharField(max_length=160)
    description = models.TextField()
    occurred_on = models.DateField()
    veterinarian = models.ForeignKey(
        "veterinary.VetProfile", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="medical_histories",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-occurred_on",)
