from rest_framework import serializers, viewsets

from messaging.models import Chat, Message
from messaging.serializers import ChatSerializer, MessageSerializer


class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user).distinct()

    def perform_create(self, serializer):
        chat = serializer.save()
        chat.participants.add(self.request.user)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        return Message.objects.filter(chat__participants=self.request.user).select_related("chat", "sender")

    def perform_create(self, serializer):
        chat = serializer.validated_data["chat"]
        if not chat.participants.filter(pk=self.request.user.pk).exists():
            raise serializers.ValidationError({"chat": "You are not a participant in this chat."})
        serializer.save(sender=self.request.user)
