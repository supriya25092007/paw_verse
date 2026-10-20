from config.api import UserOwnedViewSet
from reminders.models import CareReminder
from reminders.serializers import CareReminderSerializer


class CareReminderViewSet(UserOwnedViewSet):
    queryset = CareReminder.objects.select_related("pet", "user")
    serializer_class = CareReminderSerializer
