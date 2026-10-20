from rest_framework import serializers

from accounts.models import Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "name", "code", "description")
        read_only_fields = ("id",)
