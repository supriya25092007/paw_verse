from django.contrib.auth import password_validation
from rest_framework import serializers

from accounts.models import User


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ("id", "email", "password", "first_name", "last_name")
        read_only_fields = ("id",)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CurrentUserSerializer(serializers.ModelSerializer):
    roles = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    profile_photo = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "profile_photo",
            "role",
            "roles",
        )
        read_only_fields = ("id", "email", "role", "roles")

    def validate_profile_photo(self, photo):
        if photo and photo.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile photos must be 5 MB or smaller.")
        return photo
