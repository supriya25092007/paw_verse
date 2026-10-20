from rest_framework import serializers

from veterinary.models import Clinic, VetProfile


class VetProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = VetProfile
        fields = "__all__"
        read_only_fields = ("id", "user", "is_verified")
        extra_kwargs = {"license_number": {"required": True, "allow_null": False}}


class VetDirectorySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = VetProfile
        fields = (
            "id",
            "display_name",
            "clinic_name",
            "address",
            "contact_number",
            "specialization",
            "consultation_fee",
            "bio",
            "is_verified",
        )

    def get_display_name(self, profile):
        full_name = profile.user.get_full_name().strip()
        return full_name or "Veterinary professional"


class ClinicSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Clinic
        fields = "__all__"
        read_only_fields = ("id", "owner", "created_at")
