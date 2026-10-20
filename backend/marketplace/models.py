from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Listing(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        HIDDEN = "hidden", "Hidden"

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="marketplace_listings")
    title = models.CharField(max_length=180)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(0)],
    )
    category = models.CharField(max_length=80)
    image_url = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class Inquiry(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="inquiries")
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="marketplace_inquiries")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("listing", "buyer"), name="unique_listing_inquiry")]
