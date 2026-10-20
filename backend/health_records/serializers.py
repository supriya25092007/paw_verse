from rest_framework import serializers

from health_records.models import MedicalHistory, Vaccination
from pets.models import Pet


class OwnedPetRecordSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    def validate_pet(self, pet):
        request = self.context.get("request")
        if request and not Pet.objects.filter(pk=pet.pk, owner=request.user).exists():
            raise serializers.ValidationError("Select one of your own pets.")
        return pet


class VaccinationSerializer(OwnedPetRecordSerializer):
    class Meta:
        model = Vaccination
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at")


class MedicalHistorySerializer(OwnedPetRecordSerializer):
    class Meta:
        model = MedicalHistory
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at")
