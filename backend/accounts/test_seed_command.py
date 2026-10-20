from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from appointments.models import Booking as AppointmentBooking
from community.models import Post
from health_records.models import Vaccination
from marketplace.models import Listing as MarketplaceListing
from pets.models import Pet


User = get_user_model()


class SeedDemoDataCommandTests(TestCase):
    def test_seed_is_idempotent_and_preserves_existing_oliver(self):
        owner = User.objects.create_user(
            email="oliver.owner@example.test",
            password="A-test-only-password-728!",
            first_name="Existing",
        )
        oliver = Pet.objects.create(
            owner=owner,
            name="Oliver",
            species=Pet.Species.DOG,
            breed="Beagle",
            sex=Pet.Sex.MALE,
            notes="Existing pet notes must remain unchanged.",
        )

        for _ in range(2):
            call_command(
                "seed_demo_data",
                yes=True,
                allow_other_database=True,
                stdout=StringIO(),
            )

        oliver.refresh_from_db()
        self.assertEqual(oliver.notes, "Existing pet notes must remain unchanged.")
        self.assertEqual(Pet.objects.filter(owner=owner).count(), 25)
        self.assertEqual(
            Pet.objects.filter(owner=owner, notes__startswith="[PawVerse demo] pet ").count(),
            24,
        )
        self.assertEqual(Vaccination.objects.filter(user=owner).count(), 25)
        self.assertEqual(AppointmentBooking.objects.filter(user=owner).count(), 25)
        self.assertEqual(Post.objects.filter(author=owner, content__startswith="[PawVerse demo]").count(), 25)
        self.assertEqual(
            MarketplaceListing.objects.filter(title__startswith="[PawVerse demo]").count(),
            25,
        )
        self.assertEqual(
            MarketplaceListing.objects.filter(
                title__startswith="[PawVerse demo]",
                image_url__startswith="/demo-products/",
            ).count(),
            25,
        )
