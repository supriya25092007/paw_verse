from django.db.models import Q
from rest_framework import exceptions, viewsets

from config.api import UserOwnedViewSet
from marketplace.models import Inquiry, Listing
from marketplace.serializers import InquirySerializer, ListingSerializer


class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.select_related("seller")
    serializer_class = ListingSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            Q(status=Listing.Status.ACTIVE) | Q(seller=self.request.user)
        )

    def update(self, request, *args, **kwargs):
        if self.get_object().seller_id != request.user.pk:
            raise exceptions.PermissionDenied("Only the seller can update this listing.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if self.get_object().seller_id != request.user.pk:
            raise exceptions.PermissionDenied("Only the seller can remove this listing.")
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class InquiryViewSet(UserOwnedViewSet):
    queryset = Inquiry.objects.select_related("buyer", "listing")
    serializer_class = InquirySerializer
    owner_field = "buyer"
