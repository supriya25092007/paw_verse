from rest_framework import serializers

from administration.models import Analytics, Approval, AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"
        read_only_fields = ("id", "actor", "created_at")


class ApprovalSerializer(serializers.ModelSerializer):
    requested_by = serializers.PrimaryKeyRelatedField(read_only=True)
    reviewed_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Approval
        fields = "__all__"
        read_only_fields = (
            "id",
            "requested_by",
            "reviewed_by",
            "subject_type",
            "subject_id",
            "created_at",
        )


class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = "__all__"
        read_only_fields = ("id", "metric", "value", "calculated_at")
