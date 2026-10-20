from django.db.models import Q
from rest_framework import exceptions, viewsets

from config.api import UserOwnedViewSet
from services.models import Booking, Grooming, Service, Sitting
from services.serializers import BookingSerializer, GroomingSerializer, ServiceSerializer, SittingSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related("provider")
    serializer_class = ServiceSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            Q(is_active=True) | Q(provider=self.request.user)
        )

    def update(self, request, *args, **kwargs):
        if self.get_object().provider_id != request.user.pk:
            raise exceptions.PermissionDenied("Only the provider can update this service.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if self.get_object().provider_id != request.user.pk:
            raise exceptions.PermissionDenied("Only the provider can remove this service.")
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class GroomingViewSet(UserOwnedViewSet):
    queryset = Grooming.objects.select_related("service", "service__provider")
    serializer_class = GroomingSerializer
    owner_field = "service__provider"

    def perform_create(self, serializer):
        serializer.save()


class SittingViewSet(UserOwnedViewSet):
    queryset = Sitting.objects.select_related("service", "service__provider")
    serializer_class = SittingSerializer
    owner_field = "service__provider"

    def perform_create(self, serializer):
        serializer.save()


class BookingViewSet(UserOwnedViewSet):
    queryset = Booking.objects.select_related("customer", "pet", "service")
    serializer_class = BookingSerializer
    owner_field = "customer"
