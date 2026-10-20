from rest_framework import serializers

from payments.models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Transaction
        fields = "__all__"
        read_only_fields = ("id", "user", "amount", "currency", "provider_reference", "status", "created_at")
