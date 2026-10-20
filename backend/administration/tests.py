from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Role
from appointments.models import Booking as AppointmentBooking
from pets.models import Pet
from veterinary.models import VetProfile


User = get_user_model()


class AdminDashboardApiTests(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            email="member@example.test",
            password="a-safe-test-password",
        )
        self.staff = User.objects.create_superuser(
            email="staff@example.test",
            password="a-safe-test-password",
        )

    def test_dashboard_is_staff_only(self):
        endpoints = (
            "/api/admin/dashboard/",
            "/api/admin/analytics/",
            "/api/admin/approvals/",
            "/api/admin/audit-logs/",
        )
        self.client.force_authenticate(self.member)

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_returns_database_metrics_for_staff(self):
        Role.objects.create(name="Pet owner", code="pet-owner", description="Cares for pets.")
        self.client.force_authenticate(self.staff)

        response = self.client.get("/api/admin/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["metrics"]["users"], 2)
        self.assertIn("pets", response.data["metrics"])
        self.assertIn("appointment_statuses", response.data["metrics"])
        self.assertIn("recent_appointments", response.data)
        self.assertIn("recent_users", response.data)
        self.assertIn("recent_pets", response.data)
        self.assertIn("recent_activity", response.data)
        self.assertIn("pending_appointments", response.data)

    def test_dashboard_lists_pending_appointment_details_and_staff_can_review(self):
        pet = Pet.objects.create(
            owner=self.member,
            name="Mochi",
            species=Pet.Species.CAT,
        )
        vet = VetProfile.objects.create(
            user=self.member,
            specialization="General practice",
        )
        appointment = AppointmentBooking.objects.create(
            user=self.member,
            pet=pet,
            veterinarian=vet,
            scheduled_at=timezone.now(),
            reason="Persistent sneezing and watery eyes",
        )
        self.client.force_authenticate(self.staff)

        dashboard_response = self.client.get("/api/admin/dashboard/")

        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        pending = dashboard_response.data["pending_appointments"]
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]["pet__name"], "Mochi")
        self.assertEqual(pending[0]["reason"], "Persistent sneezing and watery eyes")

        review_response = self.client.patch(
            f"/api/admin/appointments/{appointment.pk}/review/",
            {"status": AppointmentBooking.Status.CONFIRMED},
            format="json",
        )

        self.assertEqual(review_response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, AppointmentBooking.Status.CONFIRMED)

    def test_non_staff_cannot_review_pending_appointments(self):
        pet = Pet.objects.create(
            owner=self.member,
            name="Mochi",
            species=Pet.Species.CAT,
        )
        vet = VetProfile.objects.create(
            user=self.member,
            specialization="General practice",
        )
        appointment = AppointmentBooking.objects.create(
            user=self.member,
            pet=pet,
            veterinarian=vet,
            scheduled_at=timezone.now(),
            reason="Persistent sneezing and watery eyes",
        )
        self.client.force_authenticate(self.member)

        response = self.client.patch(
            f"/api/admin/appointments/{appointment.pk}/review/",
            {"status": AppointmentBooking.Status.CONFIRMED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, AppointmentBooking.Status.PENDING)

    def test_staff_user_can_access_dashboard_without_superuser_status(self):
        self.member.is_staff = True
        self.member.save(update_fields=("is_staff",))
        self.client.force_authenticate(self.member)

        response = self.client.get("/api/admin/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.member.is_superuser)

    def test_dashboard_requires_authentication(self):
        response = self.client.get("/api/admin/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
