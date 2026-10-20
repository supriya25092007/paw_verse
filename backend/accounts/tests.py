from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from django.test import override_settings
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

from accounts.models import Role


User = get_user_model()


class AccountApiTests(APITestCase):
    def setUp(self):
        media_directory = TemporaryDirectory()
        self.addCleanup(media_directory.cleanup)
        media_settings = override_settings(MEDIA_ROOT=media_directory.name)
        media_settings.enable()
        self.addCleanup(media_settings.disable)

    def image_upload(self, name="profile.png"):
        image = BytesIO()
        Image.new("RGB", (2, 2), color="teal").save(image, format="PNG")
        return SimpleUploadedFile(name, image.getvalue(), content_type="image/png")

    def test_register_creates_pet_owner_without_exposing_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "  owner@example.com ",
                "password": "A-strong-password-892!",
                "first_name": "Paw",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "owner@example.com")
        self.assertNotIn("password", response.data)
        user = User.objects.get(email="owner@example.com")
        self.assertEqual(user.role, User.Role.PET_OWNER)
        self.assertTrue(user.check_password("A-strong-password-892!"))

    def test_registration_rejects_weak_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {"email": "owner@example.com", "password": "password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_jwt_login_and_current_user(self):
        user = User.objects.create_user(
            email="owner@example.com",
            password="A-strong-password-892!",
            first_name="Paw",
        )
        token_response = self.client.post(
            "/api/auth/token/",
            {"email": user.email, "password": "A-strong-password-892!"},
            format="json",
        )

        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}"
        )
        current_user_response = self.client.get("/api/auth/me/")

        self.assertEqual(current_user_response.status_code, status.HTTP_200_OK)
        self.assertEqual(current_user_response.data["email"], user.email)

    def test_user_can_upload_and_remove_profile_photo(self):
        user = User.objects.create_user(
            email="photo.owner@example.com",
            password="A-strong-password-892!",
        )
        self.client.force_authenticate(user)

        upload_response = self.client.patch(
            "/api/auth/me/",
            {"profile_photo": self.image_upload()},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, status.HTTP_200_OK)
        self.assertTrue(upload_response.data["profile_photo"].endswith(".png"))
        user.refresh_from_db()
        self.assertTrue(user.profile_photo)

        remove_response = self.client.patch(
            "/api/auth/me/",
            {"profile_photo": None},
            format="json",
        )

        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertFalse(user.profile_photo)

    def test_user_cannot_upload_non_image_as_profile_photo(self):
        user = User.objects.create_user(
            email="invalid.photo@example.com",
            password="A-strong-password-892!",
        )
        self.client.force_authenticate(user)

        response = self.client.patch(
            "/api/auth/me/",
            {"profile_photo": SimpleUploadedFile("not-image.txt", b"not an image", content_type="text/plain")},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_photo", response.data)

    def test_authenticated_users_can_read_role_definitions_but_cannot_change_them(self):
        user = User.objects.create_user(
            email="roles.owner@example.com",
            password="A-strong-password-892!",
        )
        self.client.force_authenticate(user)

        response = self.client.get("/api/roles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

        create_response = self.client.post(
            "/api/roles/",
            {"name": "Administrator", "code": "administrator", "description": "Read-only test"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_sample_role_records_are_not_exposed_in_role_directory(self):
        user = User.objects.create_user(
            email="sample.roles@example.com",
            password="A-strong-password-892!",
        )
        self.client.force_authenticate(user)

        Role.objects.create(name="Pet owner", code="pet-owner", description="Real role")
        Role.objects.create(
            name="Sample Role 15",
            code="sample-role-15",
            description="PawVerse demo role 15.",
        )

        response = self.client.get("/api/roles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_names = [item["name"] for item in response.data["results"]]
        self.assertNotIn("Sample Role 15", returned_names)
        self.assertIn("Pet owner", returned_names)

    def test_roles_require_authentication(self):
        response = self.client.get("/api/roles/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
