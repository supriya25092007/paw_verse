from config.api import UserOwnedViewSet
from notifications.models import Notification
from notifications.serializers import NotificationSerializer


class NotificationViewSet(UserOwnedViewSet):
    queryset = Notification.objects.select_related("user")
    serializer_class = NotificationSerializer
    http_method_names = ("get", "patch", "head", "options")
