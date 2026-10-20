from rest_framework import serializers

from rescue.models import RescueCase, Volunteer


class RescueCaseSerializer(serializers.ModelSerializer):
    reporter = serializers.PrimaryKeyRelatedField(read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = RescueCase
        fields = "__all__"
        read_only_fields = ("id", "reporter", "assigned_to", "status", "created_at")


class VolunteerSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = Volunteer
        fields = "__all__"
        read_only_fields = ("id", "user", "approved", "created_at")
