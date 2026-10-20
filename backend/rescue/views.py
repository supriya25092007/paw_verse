from config.api import UserOwnedViewSet
from rescue.models import RescueCase, Volunteer
from rescue.serializers import RescueCaseSerializer, VolunteerSerializer


class RescueCaseViewSet(UserOwnedViewSet):
    queryset = RescueCase.objects.select_related("reporter", "pet")
    serializer_class = RescueCaseSerializer
    owner_field = "reporter"


class VolunteerViewSet(UserOwnedViewSet):
    queryset = Volunteer.objects.select_related("user", "rescue_case")
    serializer_class = VolunteerSerializer
