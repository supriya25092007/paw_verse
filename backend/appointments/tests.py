from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from appointments.models import Booking
from pets.models import Pet
from veterinary.models import VetProfile


User = get_user_model()


class AppointmentBookingTests(APITestCase):
    def test_new_appointment_reason_drops_demo_marker(self):
        owner = User.objects.create_user(
            email="appointment.owner@example.test",
            password="A-strong-password-892!",
        )
        veterinarian = User.objects.create_user(
            email="appointment.vet@example.test",
            password="A-strong-password-892!",
        )
        pet = Pet.objects.create(
            owner=owner,
            name="Mochi",
            species=Pet.Species.CAT,
        )
        vet_profile = VetProfile.objects.create(
            user=veterinarian,
            specialization="General practice",
        )
        self.client.force_authenticate(owner)

        response = self.client.post(
            "/api/appointments/",
            {
                "pet": pet.pk,
                "veterinarian": vet_profile.pk,
                "scheduled_at": timezone.now().isoformat(),
                "reason": "[PawVerse demo] Persistent sneezing",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["reason"], "Persistent sneezing")
        self.assertFalse(
            Booking.objects.filter(
                pk=response.data["id"],
                reason__icontains="[PawVerse demo]",
            ).exists()
        )
