from config.api import UserOwnedViewSet
from health_records.models import MedicalHistory, Vaccination
from health_records.serializers import MedicalHistorySerializer, VaccinationSerializer


class VaccinationViewSet(UserOwnedViewSet):
    queryset = Vaccination.objects.select_related("pet", "user")
    serializer_class = VaccinationSerializer


class MedicalHistoryViewSet(UserOwnedViewSet):
    queryset = MedicalHistory.objects.select_related("pet", "user")
    serializer_class = MedicalHistorySerializer
