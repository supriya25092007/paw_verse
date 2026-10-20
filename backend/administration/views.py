from django.contrib.auth import get_user_model
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from administration.models import Analytics, Approval, AuditLog
from administration.serializers import AnalyticsSerializer, ApprovalSerializer, AuditLogSerializer
from appointments.models import Booking as AppointmentBooking
from health_records.models import MedicalHistory, Vaccination
from marketplace.models import Listing as MarketplaceListing
from pets.models import Pet
from veterinary.models import VetProfile


User = get_user_model()


class DashboardAPIView(APIView):
    permission_classes = (permissions.IsAdminUser,)

    def get(self, request):
        appointment_statuses = {
            row["status"]: row["total"]
            for row in AppointmentBooking.objects.values("status").annotate(total=Count("id"))
        }
        recent_appointments = list(
            AppointmentBooking.objects.select_related(
                "pet", "user", "veterinarian", "veterinarian__user"
            )
            .order_by("-scheduled_at", "-pk")
            .values(
                "id",
                "scheduled_at",
                "status",
                "reason",
                "pet__name",
                "user__first_name",
                "user__last_name",
                "user__email",
                "veterinarian__user__first_name",
                "veterinarian__user__last_name",
                "veterinarian__specialization",
            )[:8]
        )
        recent_users = list(
            User.objects.order_by("-date_joined", "-pk")
            .values("id", "first_name", "last_name", "email", "role", "date_joined")[:8]
        )
        recent_pets = list(
            Pet.objects.select_related("owner")
            .order_by("-created_at", "-pk")
            .values(
                "id",
                "name",
                "species",
                "breed",
                "created_at",
                "owner__first_name",
                "owner__last_name",
                "owner__email",
            )[:8]
        )
        recent_activity = list(
            AuditLog.objects.select_related("actor")
            .order_by("-created_at", "-pk")
            .values("id", "action", "object_type", "object_id", "created_at")[:8]
        )
        pending_appointments = list(
            AppointmentBooking.objects.filter(status=AppointmentBooking.Status.PENDING)
            .select_related("pet", "user", "veterinarian", "veterinarian__user")
            .order_by("scheduled_at", "pk")
            .values(
                "id",
                "scheduled_at",
                "reason",
                "pet__name",
                "pet__species",
                "user__first_name",
                "user__last_name",
                "user__email",
                "veterinarian__user__first_name",
                "veterinarian__user__last_name",
                "veterinarian__clinic_name",
                "veterinarian__specialization",
            )
        )
        return Response(
            {
                "metrics": {
                    "users": User.objects.count(),
                    "pets": Pet.objects.count(),
                    "veterinary_profiles": VetProfile.objects.count(),
                    "appointments": AppointmentBooking.objects.count(),
                    "marketplace_products": MarketplaceListing.objects.count(),
                    "active_products": MarketplaceListing.objects.filter(
                        status=MarketplaceListing.Status.ACTIVE
                    ).count(),
                    "vaccinations": Vaccination.objects.count(),
                    "medical_records": MedicalHistory.objects.count(),
                    "appointment_statuses": appointment_statuses,
                },
                "recent_appointments": recent_appointments,
                "recent_users": recent_users,
                "recent_pets": recent_pets,
                "recent_activity": recent_activity,
                "pending_appointments": pending_appointments,
            }
        )


class PendingAppointmentReviewAPIView(APIView):
    permission_classes = (permissions.IsAdminUser,)

    def patch(self, request, pk):
        new_status = request.data.get("status")
        allowed_statuses = (
            AppointmentBooking.Status.CONFIRMED,
            AppointmentBooking.Status.CANCELLED,
        )
        if new_status not in allowed_statuses:
            return Response(
                {"status": "Choose either confirmed or cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment = get_object_or_404(
            AppointmentBooking,
            pk=pk,
            status=AppointmentBooking.Status.PENDING,
        )
        appointment.status = new_status
        appointment.save(update_fields=("status",))
        return Response({"id": appointment.pk, "status": appointment.status})


class StaffReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.IsAdminUser,)


class AuditLogViewSet(StaffReadOnlyViewSet):
    queryset = AuditLog.objects.select_related("actor")
    serializer_class = AuditLogSerializer


class ApprovalViewSet(viewsets.ModelViewSet):
    queryset = Approval.objects.select_related(
        "requested_by", "reviewed_by"
    ).order_by("-created_at", "-pk")
    serializer_class = ApprovalSerializer
    permission_classes = (permissions.IsAdminUser,)
    http_method_names = ("get", "patch", "head", "options")

    def perform_update(self, serializer):
        serializer.save(reviewed_by=self.request.user)


class AnalyticsViewSet(StaffReadOnlyViewSet):
    queryset = Analytics.objects.all()
    serializer_class = AnalyticsSerializer
