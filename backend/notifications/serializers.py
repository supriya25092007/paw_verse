from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("id", "user", "channel", "title", "body", "sent_at", "created_at")
