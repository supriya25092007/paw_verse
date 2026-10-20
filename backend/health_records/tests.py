from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from health_records.models import Vaccination
from marketplace.models import Listing
from messaging.models import Chat, Message
from pets.models import Pet
from services.models import Service


User = get_user_model()


class PawVerseModuleApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@example.com", password="Strong-password-892!"
        )
        self.other_user = User.objects.create_user(
            email="other@example.com", password="Strong-password-893!"
        )
        self.pet = Pet.objects.create(owner=self.owner, name="Milo", species="dog")
        self.other_pet = Pet.objects.create(
            owner=self.other_user, name="Luna", species="cat"
        )
        self.client.force_authenticate(self.owner)

    def test_health_record_cannot_reference_another_users_pet(self):
        response = self.client.post(
            "/api/vaccinations/",
            {"pet": self.other_pet.pk, "name": "Rabies", "administered_on": "2026-01-01"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Vaccination.objects.exists())

    def test_health_record_ownership_is_assigned_by_the_server(self):
        response = self.client.post(
            "/api/vaccinations/",
            {
                "pet": self.pet.pk,
                "name": "Rabies",
                "administered_on": "2026-01-01",
                "user": self.other_user.pk,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        vaccination = Vaccination.objects.get()
        self.assertEqual(vaccination.user, self.owner)
        self.assertEqual(vaccination.pet, self.pet)

    def test_service_booking_uses_owner_and_validates_pet(self):
        service = Service.objects.create(
            provider=self.other_user,
            kind=Service.Kind.GROOMING,
            title="Wash",
            price="25.00",
        )
        response = self.client.post(
            "/api/service-bookings/",
            {
                "pet": self.other_pet.pk,
                "service": service.pk,
                "scheduled_at": "2026-11-01T10:00:00Z",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_users_cannot_edit_another_sellers_marketplace_listing(self):
        listing = Listing.objects.create(
            seller=self.other_user,
            title="Pet carrier",
            description="Gently used",
            price="20.00",
            category="supplies",
        )
        response = self.client.patch(
            f"/api/listings/{listing.pk}/",
            {"title": "Changed"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        listing.refresh_from_db()
        self.assertEqual(listing.title, "Pet carrier")

    def test_chat_and_message_are_limited_to_chat_participants(self):
        chat_response = self.client.post(
            "/api/chats/",
            {"participants": [self.other_user.pk]},
            format="json",
        )
        self.assertEqual(chat_response.status_code, status.HTTP_201_CREATED)
        chat = Chat.objects.get()
        self.assertSetEqual(
            set(chat.participants.values_list("pk", flat=True)),
            {self.owner.pk, self.other_user.pk},
        )

        message_response = self.client.post(
            "/api/messages/",
            {"chat": chat.pk, "content": "Hello"},
            format="json",
        )
        self.assertEqual(message_response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get()
        self.assertEqual(message.sender, self.owner)
