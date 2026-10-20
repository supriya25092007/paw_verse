from rest_framework import serializers

from django.contrib.auth import get_user_model
from messaging.models import Chat, Message


User = get_user_model()


class ChatSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True), many=True, required=False
    )

    class Meta:
        model = Chat
        fields = ("id", "participants", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = ("id", "sender", "sent_at", "read_at")
