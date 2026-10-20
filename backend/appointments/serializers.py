from rest_framework import serializers

from appointments.models import Booking
from pets.models import Pet


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    veterinarian_name = serializers.SerializerMethodField()
    veterinarian_clinic = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id",
            "user",
            "pet",
            "veterinarian",
            "veterinarian_name",
            "veterinarian_clinic",
            "scheduled_at",
            "reason",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "user", "created_at", "status")

    def get_veterinarian_name(self, obj):
        full_name = obj.veterinarian.user.get_full_name().strip()
        return full_name or obj.veterinarian.user.email

    def get_veterinarian_clinic(self, obj):
        return obj.veterinarian.clinic_name or "Independent practice"

    def validate_pet(self, pet):
        request = self.context.get("request")
        if request and not Pet.objects.filter(pk=pet.pk, owner=request.user).exists():
            raise serializers.ValidationError("Select one of your own pets.")
        return pet

    def validate_reason(self, reason):
        return reason.replace("[PawVerse demo]", "").strip()
