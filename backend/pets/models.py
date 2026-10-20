from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Pet(models.Model):
    class Species(models.TextChoices):
        DOG = "dog", "Dog"
        CAT = "cat", "Cat"
        BIRD = "bird", "Bird"
        SMALL_MAMMAL = "small_mammal", "Small mammal"
        REPTILE = "reptile", "Reptile"
        OTHER = "other", "Other"

    class Sex(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        UNKNOWN = "unknown", "Unknown"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pets",
    )
    photo = models.ImageField(upload_to="pet_photos/", blank=True, null=True)
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=20, choices=Species.choices)
    breed = models.CharField(max_length=100, blank=True)
    sex = models.CharField(
        max_length=10,
        choices=Sex.choices,
        default=Sex.UNKNOWN,
    )
    date_of_birth = models.DateField(null=True, blank=True)
    weight_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    color = models.CharField(max_length=100, blank=True)
    microchip_number = models.CharField(max_length=64, blank=True, null=True, unique=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} ({self.get_species_display()})"


PetProfile = Pet
