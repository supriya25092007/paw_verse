from config.api import UserOwnedViewSet
from appointments.models import Booking
from appointments.serializers import BookingSerializer


class BookingViewSet(UserOwnedViewSet):
    queryset = Booking.objects.select_related("user", "pet", "veterinarian")
    serializer_class = BookingSerializer
