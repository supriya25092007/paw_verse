from rest_framework import serializers

from community.models import LostFound, Post
from pets.models import Pet


class PostSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Post
        fields = "__all__"
        read_only_fields = ("id", "author", "created_at", "updated_at")


class LostFoundSerializer(serializers.ModelSerializer):
    reporter = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = LostFound
        fields = "__all__"
        read_only_fields = ("id", "reporter", "resolved", "created_at")

    def validate_pet(self, pet):
        request = self.context.get("request")
        if pet and request and not Pet.objects.filter(pk=pet.pk, owner=request.user).exists():
            raise serializers.ValidationError("Select one of your own pets.")
        return pet
