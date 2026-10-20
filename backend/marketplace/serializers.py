from rest_framework import serializers

from marketplace.models import Inquiry, Listing


class ListingSerializer(serializers.ModelSerializer):
    seller = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Listing
        fields = "__all__"
        read_only_fields = ("id", "seller", "status", "created_at")


class InquirySerializer(serializers.ModelSerializer):
    buyer = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Inquiry
        fields = "__all__"
        read_only_fields = ("id", "buyer", "created_at")

    def validate_listing(self, listing):
        request = self.context.get("request")
        if request and listing.seller_id == request.user.pk:
            raise serializers.ValidationError("You cannot inquire about your own listing.")
        if listing.status != Listing.Status.ACTIVE:
            raise serializers.ValidationError("This listing is not accepting inquiries.")
        return listing
