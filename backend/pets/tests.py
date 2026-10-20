from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import override_settings
from PIL import Image

from pets.models import Pet


User = get_user_model()


class PetApiTests(APITestCase):
    def setUp(self):
        media_directory = TemporaryDirectory()
        self.addCleanup(media_directory.cleanup)
        media_settings = override_settings(MEDIA_ROOT=media_directory.name)
        media_settings.enable()
        self.addCleanup(media_settings.disable)
        self.owner = User.objects.create_user(
            email="owner@example.com", password="A-strong-password-892!"
        )
        self.other_owner = User.objects.create_user(
            email="other@example.com", password="A-strong-password-892!"
        )
        self.pet = Pet.objects.create(
            owner=self.owner,
            name="Milo",
            species=Pet.Species.DOG,
        )

    def image_upload(self, name="pet.png"):
        image = BytesIO()
        Image.new("RGB", (2, 2), color="coral").save(image, format="PNG")
        return SimpleUploadedFile(name, image.getvalue(), content_type="image/png")

    def test_pet_endpoints_require_authentication(self):
        response = self.client.get("/api/pets/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_can_create_and_list_pets(self):
        self.client.force_authenticate(self.owner)
        create_response = self.client.post(
            "/api/pets/",
            {
                "name": "Luna",
                "species": "cat",
                "owner": self.other_owner.pk,
            },
            format="json",
        )
        list_response = self.client.get("/api/pets/")

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["owner"], self.owner.pk)
        self.assertEqual(list_response.data["count"], 2)

    def test_owner_cannot_read_or_change_another_users_pet(self):
        self.client.force_authenticate(self.other_owner)

        detail_response = self.client.get(f"/api/pets/{self.pet.pk}/")
        update_response = self.client.patch(
            f"/api/pets/{self.pet.pk}/",
            {"name": "Changed"},
            format="json",
        )

        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(update_response.status_code, status.HTTP_404_NOT_FOUND)
        self.pet.refresh_from_db()
        self.assertEqual(self.pet.name, "Milo")

    def test_pet_rejects_future_birth_date(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            "/api/pets/",
            {
                "name": "Future pet",
                "species": "dog",
                "date_of_birth": "2999-01-01",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date_of_birth", response.data)

    def test_owner_can_upload_and_remove_pet_photo(self):
        self.client.force_authenticate(self.owner)

        upload_response = self.client.patch(
            f"/api/pets/{self.pet.pk}/",
            {"photo": self.image_upload()},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, status.HTTP_200_OK)
        self.assertTrue(upload_response.data["photo"].endswith(".png"))
        self.pet.refresh_from_db()
        self.assertTrue(self.pet.photo)

        remove_response = self.client.patch(
            f"/api/pets/{self.pet.pk}/",
            {"photo": None},
            format="json",
        )

        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
        self.pet.refresh_from_db()
        self.assertFalse(self.pet.photo)

    def test_pet_rejects_non_image_photo(self):
        self.client.force_authenticate(self.owner)

        response = self.client.patch(
            f"/api/pets/{self.pet.pk}/",
            {"photo": SimpleUploadedFile("not-image.txt", b"not an image", content_type="text/plain")},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("photo", response.data)
