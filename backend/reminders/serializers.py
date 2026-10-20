from rest_framework import serializers

from pets.models import Pet
from reminders.models import CareReminder


class CareReminderSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = CareReminder
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at")

    def validate_pet(self, pet):
        request = self.context.get("request")
        if request and not Pet.objects.filter(pk=pet.pk, owner=request.user).exists():
            raise serializers.ValidationError("Select one of your own pets.")
        return pet
