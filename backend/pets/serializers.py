from django.utils import timezone
from rest_framework import serializers

from pets.models import Pet


class PetSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Pet
        fields = (
            "id",
            "owner",
            "photo",
            "name",
            "species",
            "breed",
            "sex",
            "date_of_birth",
            "weight_kg",
            "color",
            "microchip_number",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")

    def validate_date_of_birth(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate_microchip_number(self, value):
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None

    def validate_photo(self, photo):
        if photo and photo.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Pet photos must be 5 MB or smaller.")
        return photo
