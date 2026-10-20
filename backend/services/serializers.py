from rest_framework import serializers

from pets.models import Pet
from services.models import Booking, Grooming, Service, Sitting


class ServiceSerializer(serializers.ModelSerializer):
    provider = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Service
        fields = "__all__"
        read_only_fields = ("id", "provider", "created_at")


class GroomingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grooming
        fields = "__all__"
        read_only_fields = ("id",)

    def validate_service(self, service):
        request = self.context.get("request")
        if request and service.provider_id != request.user.pk:
            raise serializers.ValidationError("Select one of your own services.")
        if service.kind != Service.Kind.GROOMING:
            raise serializers.ValidationError("This service is not a grooming service.")
        return service


class SittingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sitting
        fields = "__all__"
        read_only_fields = ("id",)

    def validate_service(self, service):
        request = self.context.get("request")
        if request and service.provider_id != request.user.pk:
            raise serializers.ValidationError("Select one of your own services.")
        if service.kind != Service.Kind.SITTING:
            raise serializers.ValidationError("This service is not a sitting service.")
        return service


class BookingSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = ("id", "customer", "status", "created_at")

    def validate_pet(self, pet):
        request = self.context.get("request")
        if request and not Pet.objects.filter(pk=pet.pk, owner=request.user).exists():
            raise serializers.ValidationError("Select one of your own pets.")
        return pet

    def validate_service(self, service):
        if not service.is_active:
            raise serializers.ValidationError("This service is not available for booking.")
        return service
