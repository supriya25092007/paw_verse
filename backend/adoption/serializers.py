from rest_framework import serializers

from adoption.models import Application, Listing
from pets.models import Pet


class ListingSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    contact_number = serializers.CharField(max_length=32, required=True)
    pet_name = serializers.CharField(source="pet.name", read_only=True)
    pet_species = serializers.CharField(source="pet.get_species_display", read_only=True)
    pet_breed = serializers.CharField(source="pet.breed", read_only=True)

    class Meta:
        model = Listing
        fields = "__all__"
        read_only_fields = ("id", "owner", "created_at", "status")

    def validate_pet(self, pet):
        request = self.context.get("request")
        if request and not Pet.objects.filter(pk=pet.pk, owner=request.user).exists():
            raise serializers.ValidationError("Select one of your own pets.")
        return pet


class ApplicationSerializer(serializers.ModelSerializer):
    applicant = serializers.PrimaryKeyRelatedField(read_only=True)
    contact_number = serializers.CharField(max_length=32, required=True)
    listing_pet_name = serializers.CharField(source="listing.pet.name", read_only=True)
    listing_pet_species = serializers.CharField(source="listing.pet.get_species_display", read_only=True)
    listing_pet_breed = serializers.CharField(source="listing.pet.breed", read_only=True)

    class Meta:
        model = Application
        fields = "__all__"
        read_only_fields = ("id", "applicant", "created_at")

    def validate_listing(self, listing):
        request = self.context.get("request")
        if request and listing.owner_id == request.user.pk:
            raise serializers.ValidationError("You cannot apply to your own listing.")
        if listing.status != Listing.Status.AVAILABLE:
            raise serializers.ValidationError("This listing is not accepting applications.")
        return listing
