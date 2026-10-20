from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from veterinary.models import VetProfile


User = get_user_model()


class VetDirectoryApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@example.test",
            password="a-safe-test-password",
        )
        self.verified_vet = User.objects.create_user(
            email="verified.vet@example.test",
            password="a-safe-test-password",
            first_name="Avery",
            last_name="Reed",
            role=User.Role.VETERINARIAN,
        )
        self.hidden_vet = User.objects.create_user(
            email="unverified.vet@example.test",
            password="a-safe-test-password",
            role=User.Role.VETERINARIAN,
        )
        VetProfile.objects.create(
            user=self.verified_vet,
            clinic_name="Northstar Animal Care",
            address="12 Northstar Road",
            contact_number="+1-555-010-1234",
            specialization="Small animal medicine",
            consultation_fee="45.00",
            bio="Compassionate preventive care.",
            is_verified=True,
        )
        VetProfile.objects.create(
            user=self.hidden_vet,
            clinic_name="Unlisted practice",
            specialization="Surgery",
            is_verified=False,
        )
        self.client.force_authenticate(self.owner)

    def test_directory_includes_verified_profiles_but_not_other_unverified_profiles(self):
        response = self.client.get("/api/vet-directory/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        records = response.data["results"] if isinstance(response.data, dict) else response.data
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["display_name"], "Avery Reed")
        self.assertEqual(records[0]["clinic_name"], "Northstar Animal Care")
        self.assertEqual(records[0]["address"], "12 Northstar Road")
        self.assertEqual(records[0]["contact_number"], "+1-555-010-1234")
        self.assertTrue(records[0]["is_verified"])

    def test_directory_includes_the_requesting_vet_own_unverified_profile(self):
        self.client.force_authenticate(self.hidden_vet)

        response = self.client.get("/api/vet-directory/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        records = response.data["results"] if isinstance(response.data, dict) else response.data
        self.assertEqual(len(records), 2)
        self.assertTrue(any(record["id"] == self.hidden_vet.vet_profile.id for record in records))

    def test_directory_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/vet-directory/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
