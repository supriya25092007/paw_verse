from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from adoption.models import Application, Listing
from pets.models import Pet


User = get_user_model()


class AdoptionContactAndPetDetailsTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="adoption.owner@example.test",
            password="A-strong-password-892!",
        )
        self.applicant = User.objects.create_user(
            email="adoption.applicant@example.test",
            password="A-strong-password-892!",
        )
        self.pet = Pet.objects.create(
            owner=self.owner,
            name="Mochi",
            species=Pet.Species.CAT,
            breed="Domestic Shorthair",
        )
        self.listing = Listing.objects.create(
            owner=self.owner,
            pet=self.pet,
            contact_number="+1-202-555-0100",
            description="A friendly cat looking for a home.",
        )

    def test_adoption_listing_returns_contact_and_pet_details(self):
        self.client.force_authenticate(self.applicant)

        response = self.client.get(f"/api/adoption-listings/{self.listing.pk}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["contact_number"], "+1-202-555-0100")
        self.assertEqual(response.data["pet_name"], "Mochi")
        self.assertEqual(response.data["pet_species"], "Cat")
        self.assertEqual(response.data["pet_breed"], "Domestic Shorthair")

    def test_adoption_application_returns_contact_and_listed_pet_details(self):
        application = Application.objects.create(
            applicant=self.applicant,
            listing=self.listing,
            contact_number="+1-202-555-0125",
            message="I can provide a caring home.",
        )
        self.client.force_authenticate(self.owner)

        response = self.client.get(f"/api/adoption-applications/{application.pk}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["contact_number"], "+1-202-555-0125")
        self.assertEqual(response.data["listing_pet_name"], "Mochi")
        self.assertEqual(response.data["listing_pet_species"], "Cat")
        self.assertEqual(response.data["listing_pet_breed"], "Domestic Shorthair")
