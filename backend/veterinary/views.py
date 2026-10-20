from django.db.models import Q
from rest_framework import generics, permissions

from config.api import UserOwnedViewSet
from veterinary.models import Clinic, VetProfile
from veterinary.serializers import (
    ClinicSerializer,
    VetDirectorySerializer,
    VetProfileSerializer,
)


class VetDirectoryView(generics.ListAPIView):
    serializer_class = VetDirectorySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return VetProfile.objects.filter(
            Q(is_verified=True) | Q(user=self.request.user)
        ).select_related("user").order_by("clinic_name", "user__last_name", "pk")


class VetProfileViewSet(UserOwnedViewSet):
    queryset = VetProfile.objects.select_related("user").order_by("clinic_name", "pk")
    serializer_class = VetProfileSerializer


class ClinicViewSet(UserOwnedViewSet):
    queryset = Clinic.objects.select_related("owner")
    serializer_class = ClinicSerializer
    owner_field = "owner"
