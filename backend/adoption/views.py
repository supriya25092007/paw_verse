from django.db.models import Q
from rest_framework import exceptions, viewsets

from adoption.models import Application, Listing
from adoption.serializers import ApplicationSerializer, ListingSerializer


class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.select_related("owner", "pet")
    serializer_class = ListingSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            Q(status=Listing.Status.AVAILABLE) | Q(owner=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        if self.get_object().owner_id != request.user.pk:
            raise exceptions.PermissionDenied("Only the listing owner can update this listing.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if self.get_object().owner_id != request.user.pk:
            raise exceptions.PermissionDenied("Only the listing owner can remove this listing.")
        return super().destroy(request, *args, **kwargs)


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.select_related("applicant", "listing")
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            Q(applicant=self.request.user) | Q(listing__owner=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    def perform_update(self, serializer):
        application = self.get_object()
        if "listing" in serializer.validated_data:
            raise exceptions.PermissionDenied("An application cannot be moved to another listing.")
        new_status = serializer.validated_data.get("status", application.status)
        if application.applicant_id == self.request.user.pk:
            allowed = {application.status, Application.Status.WITHDRAWN}
        else:
            allowed = {Application.Status.APPROVED, Application.Status.REJECTED}
        if new_status not in allowed:
            raise exceptions.PermissionDenied("You cannot set this application status.")
        serializer.save()
