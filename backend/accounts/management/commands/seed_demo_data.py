from datetime import datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role
from adoption.models import Application, Listing as AdoptionListing
from administration.models import Analytics, Approval, AuditLog
from appointments.models import Booking as AppointmentBooking
from community.models import LostFound, Post
from health_records.models import MedicalHistory, Vaccination
from marketplace.models import Inquiry, Listing as MarketplaceListing
from messaging.models import Chat, Message
from notifications.models import Notification
from payments.models import Transaction
from pets.models import Pet
from reminders.models import CareReminder
from rescue.models import RescueCase, Volunteer
from services.models import (
    Booking as ServiceBooking,
    Grooming,
    Service,
    Sitting,
)
from veterinary.models import Clinic, VetProfile


User = get_user_model()
DEMO_PREFIX = "[PawVerse demo]"
DEFAULT_DEMO_EMAIL = "demo.owner@pawverse.example"
PET_NAMES = (
    "Oliver",
    "Maple",
    "Biscuit",
    "Cleo",
    "Milo",
    "Poppy",
    "Archie",
    "Nala",
    "Waffles",
    "Juniper",
    "Teddy",
    "Coco",
    "Scout",
    "Pepper",
    "Luna",
    "Finn",
    "Daisy",
    "Benny",
    "Willow",
    "Otis",
    "Mochi",
    "Rosie",
    "Rumi",
    "Bailey",
    "Ziggy",
)
PET_TYPES = (
    ("dog", "Beagle", "male", "Tri-color"),
    ("dog", "Golden Retriever", "female", "Golden"),
    ("cat", "Domestic Shorthair", "female", "Tabby"),
    ("dog", "Cavalier King Charles Spaniel", "male", "Chestnut"),
    ("small_mammal", "Holland Lop", "female", "White and grey"),
    ("dog", "Mixed breed", "unknown", "Cream"),
    ("cat", "Maine Coon", "male", "Silver"),
    ("bird", "Cockatiel", "female", "Grey"),
    ("dog", "Corgi", "male", "Red and white"),
    ("reptile", "Leopard Gecko", "unknown", "Spotted"),
)
VACCINES = (
    "Rabies",
    "DHPP",
    "Bordetella",
    "FVRCP",
    "Leptospirosis",
)
CARE_TITLES = (
    "Annual wellness visit",
    "Dental check-up",
    "Nutrition review",
    "Skin and coat check",
    "Follow-up consultation",
)
APPOINTMENT_CONCERNS = (
    "Annual wellness check and vaccination review.",
    "Itchy skin and coat irritation.",
    "Change in appetite and lower energy.",
    "Dental discomfort and bad breath.",
    "Follow-up after recent treatment.",
    "Digestive upset over the past few days.",
    "Limping after exercise.",
    "Ear irritation and frequent head shaking.",
    "Nutrition and healthy-weight review.",
    "Routine health check before travel.",
)
MARKETPLACE_ITEMS = (
    (
        "Trail-ready harness",
        "accessories",
        "A comfortable adjustable harness for daily walks.",
        "/demo-products/trail-harness.svg",
    ),
    (
        "Slow feeder bowl",
        "food",
        "A sturdy bowl designed to make mealtimes calmer.",
        "/demo-products/slow-feeder-bowl.svg",
    ),
    (
        "Puzzle treat toy",
        "toys",
        "A washable enrichment toy for curious pets.",
        "/demo-products/puzzle-treat-toy.svg",
    ),
    (
        "Soft travel blanket",
        "bedding",
        "A lightweight blanket for naps at home or on the go.",
        "/demo-products/travel-blanket.svg",
    ),
    (
        "Everyday grooming brush",
        "grooming",
        "A gentle brush for regular coat care.",
        "/demo-products/grooming-brush.svg",
    ),
)
GROOMING_SERVICES = (
    "Gentle bath and brush",
    "Paw tidy and nail trim",
    "Full coat refresh",
    "Sensitive-skin grooming",
    "Puppy introduction groom",
)
SITTING_SERVICES = (
    "Neighbourhood pet sitting",
    "At-home daytime visits",
    "Weekend companion care",
    "Overnight home sitting",
    "Small-pet check-in",
)


def _get_or_create_user(email, **fields):
    user = User.objects.filter(email=email).first()
    if user:
        return user, False
    return (
        User.objects.create_user(
            email=email,
            password=None,
            **fields,
        ),
        True,
    )


def _get_or_create(model, identity, defaults=None):
    return model.objects.get_or_create(**identity, defaults=defaults or {})


def _aware_at(day_offset, hour=10):
    local_day = timezone.localdate() + timedelta(days=day_offset)
    naive = datetime.combine(local_day, time(hour=hour))
    return timezone.make_aware(naive, timezone.get_current_timezone())


class Command(BaseCommand):
    help = "Add a safe, rerunnable set of fictional PawVerse demonstration records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--owner-email",
            help=(
                "Attach demo-owned records to this existing account, or create "
                "it with an unusable password if it does not exist."
            ),
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Confirm writes to the configured PawVerse MySQL database.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Exercise the seeding path, then roll back all database writes.",
        )
        parser.add_argument(
            "--allow-other-database",
            action="store_true",
            help="Allow a non-MySQL/non-pawverse database (for isolated tests only).",
        )

    def handle(self, *args, **options):
        if not options["dry_run"] and not options["yes"]:
            raise CommandError("No records were written. Rerun with --yes to confirm.")

        database_name = str(connection.settings_dict["NAME"])
        is_expected_database = (
            connection.vendor == "mysql" and database_name.casefold() == "pawverse"
        )
        if not is_expected_database and not options["allow_other_database"]:
            raise CommandError(
                "Refusing to seed unexpected database target "
                f"{connection.vendor}/{database_name!r}. Expected MySQL database "
                "'pawverse'. Use --allow-other-database only for isolated tests."
            )

        self.stdout.write(
            f"Target database: {connection.vendor}/{database_name} "
            f"({connection.settings_dict.get('HOST') or 'local'})"
        )
        if options["dry_run"]:
            self.stdout.write("Dry run: all changes will be rolled back.")

        with transaction.atomic():
            owner = self._get_demo_owner(options["owner_email"])
            counts = self._seed(owner)
            api_counts = self._verify_api(owner)

            if options["dry_run"]:
                transaction.set_rollback(True)

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry run complete; no changes saved."))
        else:
            self.stdout.write(self.style.SUCCESS("Demo records are ready."))
        self.stdout.write(f"Demo account: {owner.email}")
        self.stdout.write("Fixture counts:")
        for label, count in counts.items():
            self.stdout.write(f"  {label}: {count}")
        self.stdout.write("Authenticated API list counts and access checks:")
        for endpoint, count in api_counts.items():
            self.stdout.write(f"  /api/{endpoint}/: {count}")
        self.stdout.write(
            "Vet profiles and clinics are owner-scoped; the veterinary directory "
            "shows verified professionals and the signed-in provider's own profile. "
            "Administration endpoints are staff-only; role definitions are "
            "authenticated and read-only."
        )

    def _get_demo_owner(self, owner_email):
        if owner_email:
            owner, _ = _get_or_create_user(
                owner_email.strip().lower(),
                first_name="Demo",
                last_name="Pet Parent",
                role=User.Role.PET_OWNER,
            )
        else:
            oliver = (
                Pet.objects.select_related("owner")
                .filter(name__iexact="Oliver", breed__iexact="Beagle")
                .first()
            )
            if oliver:
                owner = oliver.owner
            else:
                owner, _ = _get_or_create_user(
                    DEFAULT_DEMO_EMAIL,
                    first_name="Demo",
                    last_name="Pet Parent",
                    role=User.Role.PET_OWNER,
                )

        if not owner.is_active:
            raise CommandError(
                "The selected demo owner account is inactive. Choose an active "
                "account with --owner-email."
            )
        return owner

    def _seed(self, owner):
        counts = {}

        roles = (
            ("Pet owner", "pet-owner", "A person caring for one or more pets."),
            ("Veterinarian", "veterinarian", "A fictional veterinary professional."),
            ("Clinic staff", "clinic-staff", "A fictional veterinary clinic team member."),
            ("Shelter staff", "shelter-staff", "A fictional animal shelter team member."),
            ("Service provider", "service-provider", "A fictional pet-care service provider."),
        )
        for name, code, description in roles:
            _get_or_create(Role, {"code": code}, {"name": name, "description": description})
        counts["accounts.Role"] = len(roles)

        members = []
        for index in range(1, 26):
            member, _ = _get_or_create_user(
                f"demo.member.{index:02d}@pawverse.example",
                first_name=("Casey", "Riley", "Morgan", "Avery", "Jordan")[index % 5],
                last_name=("Parker", "Rivera", "Kim", "Patel", "Reed")[index % 5],
                role=(
                    User.Role.SHELTER_STAFF
                    if index % 5 == 0
                    else User.Role.SERVICE_PROVIDER
                    if index % 4 == 0
                    else User.Role.PET_OWNER
                ),
            )
            members.append(member)

        veterinarians = []
        for index in range(1, 26):
            vet_user, _ = _get_or_create_user(
                f"demo.vet.{index:02d}@pawverse.example",
                first_name=("Taylor", "Jamie", "Alex", "Sam", "Drew")[index % 5],
                last_name=("Chen", "Morgan", "Brooks", "Singh", "Lopez")[index % 5],
                role=User.Role.VETERINARIAN,
            )
            profile, _ = _get_or_create(
                VetProfile,
                {"user": vet_user},
                {
                    "clinic_name": f"Companion Clinic {index:02d}",
                    "address": f"{100 + index} Garden Lane, Sample District",
                    "contact_number": f"+1-555-010-{index:02d}",
                    "specialization": (
                        "General practice",
                        "Preventive care",
                        "Feline medicine",
                        "Small animal surgery",
                        "Dermatology",
                    )[index % 5],
                    "license_number": f"DEMO-VET-{index:04d}",
                    "consultation_fee": Decimal(f"{65 + (index % 8) * 5}.00"),
                    "bio": f"Veterinary professional profile {index:02d}.",
                    "is_verified": True,
                },
            )
            if profile.clinic_name.startswith(DEMO_PREFIX):
                profile.clinic_name = profile.clinic_name[len(DEMO_PREFIX):].strip()
                profile.save(update_fields=("clinic_name",))
            cleaned_bio = profile.bio.replace(DEMO_PREFIX, "").strip()
            if cleaned_bio != profile.bio:
                profile.bio = cleaned_bio
                profile.save(update_fields=("bio",))
            if not profile.clinic_name:
                profile.clinic_name = f"Companion Clinic {index:02d}"
                profile.save(update_fields=("clinic_name",))
            profile_updates = []
            if not profile.address:
                profile.address = f"{100 + index} Garden Lane, Sample District"
                profile_updates.append("address")
            if not profile.contact_number:
                profile.contact_number = f"+1-555-010-{index:02d}"
                profile_updates.append("contact_number")
            if profile_updates:
                profile.save(update_fields=profile_updates)
            veterinarians.append(profile)
        counts["accounts.User (demo members)"] = len(members)
        counts["accounts.User (veterinarians)"] = len(veterinarians)
        counts["veterinary.VetProfile"] = len(veterinarians)

        today = timezone.localdate()
        existing_oliver = (
            Pet.objects.filter(
                owner=owner,
                name__iexact="Oliver",
                breed__iexact="Beagle",
            )
            .order_by("pk")
            .first()
        )
        global_oliver_exists = Pet.objects.filter(
            name__iexact="Oliver",
            breed__iexact="Beagle",
        ).exists()
        pet_names = list(PET_NAMES)
        if global_oliver_exists and not existing_oliver:
            pet_names[0] = "Milo"

        pets = []
        if existing_oliver:
            pets.append(existing_oliver)
        for index in range(1 if existing_oliver else 0, 25):
            name = pet_names[index]
            species, breed, sex, color = PET_TYPES[index % len(PET_TYPES)]
            marker = f"{DEMO_PREFIX} pet {index + 1:02d}"
            pet, _ = _get_or_create(
                Pet,
                {"owner": owner, "notes": marker},
                {
                    "name": name,
                    "species": species,
                    "breed": breed,
                    "sex": sex,
                    "date_of_birth": today - timedelta(days=365 * (1 + index % 12) + 30 * (index % 11)),
                    "weight_kg": Decimal(f"{3.5 + (index % 20) * 1.25:.2f}"),
                    "color": color,
                    "microchip_number": f"PVDEMO{index + 1:08d}",
                },
            )
            pets.append(pet)
        counts["pets.Pet"] = len(pets)

        clinics = []
        for index in range(1, 26):
            clinic, _ = _get_or_create(
                Clinic,
                {"owner": owner, "name": f"{DEMO_PREFIX} Neighbourhood Vet {index:02d}"},
                {
                    "address": f"{100 + index} Garden Lane, Sample District",
                    "phone": f"+1-555-010-{index:02d}",
                    "email": f"clinic.{index:02d}@pawverse.example",
                    "opening_hours": {
                        "weekdays": "09:00-18:00",
                        "saturday": "09:00-13:00",
                        "sunday": "Closed",
                    },
                },
            )
            clinics.append(clinic)
        counts["veterinary.Clinic"] = len(clinics)

        for index in range(25):
            pet = pets[index]
            vet = veterinarians[index]
            _get_or_create(
                Vaccination,
                {
                    "user": owner,
                    "pet": pet,
                    "name": f"{DEMO_PREFIX} {VACCINES[index % len(VACCINES)]} {index + 1:02d}",
                },
                {
                    "administered_on": today - timedelta(days=35 + index * 9),
                    "next_due_on": today + timedelta(days=40 + index * 5),
                    "veterinarian": vet,
                    "notes": "Routine care record for demonstration.",
                },
            )
            _get_or_create(
                MedicalHistory,
                {
                    "user": owner,
                    "pet": pet,
                    "title": f"{DEMO_PREFIX} {CARE_TITLES[index % len(CARE_TITLES)]} {index + 1:02d}",
                },
                {
                    "contact_number": f"+1-202-555-01{index:02d}",
                    "description": (
                        "Routine check completed; appetite, activity, and comfort "
                        "were discussed with the care team."
                    ),
                    "occurred_on": today - timedelta(days=20 + index * 7),
                    "veterinarian": vet,
                },
            )
        counts["health_records.Vaccination"] = 25
        counts["health_records.MedicalHistory"] = 25

        appointments = []
        for index in range(25):
            pet = pets[index]
            vet = veterinarians[index]
            reason = APPOINTMENT_CONCERNS[index % len(APPOINTMENT_CONCERNS)]
            legacy_reason = f"{DEMO_PREFIX} wellness appointment {index + 1:02d}"
            AppointmentBooking.objects.filter(
                user=owner,
                pet=pet,
                reason=legacy_reason,
            ).update(reason=reason)
            appointment, _ = _get_or_create(
                AppointmentBooking,
                {"user": owner, "pet": pet, "reason": reason},
                {
                    "veterinarian": vet,
                    "scheduled_at": _aware_at(index - 6, 9 + index % 8),
                    "status": (
                        AppointmentBooking.Status.COMPLETED
                        if index < 8
                        else AppointmentBooking.Status.CONFIRMED
                        if index < 16
                        else AppointmentBooking.Status.PENDING
                    ),
                },
            )
            appointments.append(appointment)
            _get_or_create(
                CareReminder,
                {
                    "user": owner,
                    "pet": pet,
                    "title": f"{DEMO_PREFIX} {CARE_TITLES[index % len(CARE_TITLES)]} reminder {index + 1:02d}",
                },
                {
                    "details": "A friendly reminder to keep your pet's care on track.",
                    "due_at": _aware_at(index - 5, 10),
                    "recurrence": ("monthly", "quarterly", "yearly")[index % 3],
                    "status": (
                        CareReminder.Status.DONE
                        if index % 6 == 0
                        else CareReminder.Status.OPEN
                    ),
                },
            )
        counts["appointments.Booking"] = 25
        counts["reminders.CareReminder"] = 25

        adoption_listings = []
        for index in range(25):
            listing, _ = _get_or_create(
                AdoptionListing,
                {"owner": owner, "pet": pets[index]},
                {
                    "description": (
                        f"{DEMO_PREFIX} Meet {pets[index].name}, a much-loved "
                        "companion looking for a safe and caring home."
                    ),
                    "status": (
                        AdoptionListing.Status.AVAILABLE
                        if index < 15
                        else AdoptionListing.Status.PENDING
                        if index < 20
                        else AdoptionListing.Status.ADOPTED
                    ),
                },
            )
            if not listing.contact_number:
                listing.contact_number = f"+1-202-555-01{index:02d}"
                listing.save(update_fields=("contact_number",))
            adoption_listings.append(listing)
            application, _ = _get_or_create(
                Application,
                {"applicant": members[index], "listing": listing},
                {
                    "contact_number": f"+1-202-555-01{index + 25:02d}",
                    "message": (
                        f"{DEMO_PREFIX} Application {index + 1:02d}: "
                        "I would love to learn more about this pet and their needs."
                    ),
                    "status": (
                        Application.Status.APPROVED
                        if index % 6 == 0
                        else Application.Status.REJECTED
                        if index % 7 == 0
                        else Application.Status.PENDING
                    ),
                },
            )
            if not application.contact_number:
                application.contact_number = f"+1-202-555-01{index + 25:02d}"
                application.save(update_fields=("contact_number",))
        counts["adoption.Listing"] = 25
        counts["adoption.Application"] = 25

        rescue_cases = []
        for index in range(25):
            rescue_case, _ = _get_or_create(
                RescueCase,
                {
                    "reporter": owner,
                    "description": f"{DEMO_PREFIX} animal welfare report {index + 1:02d}",
                },
                {
                    "assigned_to": members[index],
                    "pet": pets[index],
                    "location": f"{100 + index} Meadow Walk, Sample District",
                    "status": (
                        RescueCase.Status.RESOLVED
                        if index % 5 == 0
                        else RescueCase.Status.ASSIGNED
                        if index % 3 == 0
                        else RescueCase.Status.REPORTED
                    ),
                },
            )
            rescue_cases.append(rescue_case)
            _get_or_create(
                Volunteer,
                {"user": owner, "rescue_case": rescue_case},
                {
                    "message": f"{DEMO_PREFIX} Available to assist with case {index + 1:02d}.",
                    "approved": index % 3 == 0,
                },
            )
        counts["rescue.RescueCase"] = 25
        counts["rescue.Volunteer"] = 25

        marketplace_listings = []
        for index in range(25):
            item_name, category, description, image_url = MARKETPLACE_ITEMS[index % len(MARKETPLACE_ITEMS)]
            listing, _ = _get_or_create(
                MarketplaceListing,
                {"seller": members[index], "title": f"{DEMO_PREFIX} {item_name} {index + 1:02d}"},
                {
                    "description": description,
                    "price": Decimal(f"{12 + index * 2}.00"),
                    "category": category,
                    "image_url": image_url,
                    "status": MarketplaceListing.Status.ACTIVE,
                },
            )
            if listing.image_url != image_url:
                MarketplaceListing.objects.filter(pk=listing.pk).update(image_url=image_url)
            marketplace_listings.append(listing)
            _get_or_create(
                Inquiry,
                {"listing": listing, "buyer": owner},
                {
                    "message": (
                        f"{DEMO_PREFIX} Is item {index + 1:02d} still available? "
                        "Could you share a little more about it?"
                    ),
                },
            )
        counts["marketplace.Listing"] = 25
        counts["marketplace.Inquiry"] = 25

        services = []
        for index in range(25):
            title = f"{DEMO_PREFIX} {GROOMING_SERVICES[index % len(GROOMING_SERVICES)]} {index + 1:02d}"
            service, _ = _get_or_create(
                Service,
                {"provider": owner, "title": title},
                {
                    "kind": Service.Kind.GROOMING,
                    "description": "Calm, pet-first care with time for every animal.",
                    "price": Decimal(f"{35 + index * 3}.00"),
                    "is_active": True,
                },
            )
            _get_or_create(
                Grooming,
                {"service": service},
                {
                    "duration_minutes": 30 + (index % 5) * 15,
                    "includes_bath": index % 2 == 0,
                },
            )
            services.append(service)

        sitting_services = []
        for index in range(25):
            title = f"{DEMO_PREFIX} {SITTING_SERVICES[index % len(SITTING_SERVICES)]} {index + 1:02d}"
            service, _ = _get_or_create(
                Service,
                {"provider": owner, "title": title},
                {
                    "kind": Service.Kind.SITTING,
                    "description": "Reliable, thoughtful company in your pet's familiar home.",
                    "price": Decimal(f"{25 + index * 4}.00"),
                    "is_active": True,
                },
            )
            _get_or_create(
                Sitting,
                {"service": service},
                {
                    "overnight": index % 4 == 0,
                    "service_area": "Sample District and nearby neighbourhoods",
                },
            )
            sitting_services.append(service)
        counts["services.Service"] = 50
        counts["services.Grooming"] = 25
        counts["services.Sitting"] = 25

        for index in range(25):
            service = (services + sitting_services)[index]
            _get_or_create(
                ServiceBooking,
                {"customer": owner, "pet": pets[index], "service": service},
                {
                    "scheduled_at": _aware_at(index - 4, 11 + index % 6),
                    "status": (
                        ServiceBooking.Status.COMPLETED
                        if index < 8
                        else ServiceBooking.Status.CONFIRMED
                        if index < 16
                        else ServiceBooking.Status.PENDING
                    ),
                },
            )
        counts["services.Booking"] = 25

        for index in range(25):
            _get_or_create(
                Transaction,
                {
                    "user": owner,
                    "provider_reference": f"PV-DEMO-TRANSACTION-{index + 1:04d}",
                },
                {
                    "amount": Decimal(f"{18 + index * 4}.00"),
                    "currency": "USD",
                    "status": (
                        Transaction.Status.SUCCEEDED
                        if index % 4 != 0
                        else Transaction.Status.PENDING
                    ),
                },
            )
            post_content = (
                f"{DEMO_PREFIX} Community update {index + 1:02d}: "
                "sharing a small win, a new routine, or a happy pet moment."
            )
            _get_or_create(
                Post,
                {"author": owner, "content": post_content},
            )
            _get_or_create(
                LostFound,
                {
                    "reporter": owner,
                    "description": f"{DEMO_PREFIX} lost and found report {index + 1:02d}",
                },
                {
                    "pet": pets[index],
                    "report_type": LostFound.ReportType.LOST if index % 2 == 0 else LostFound.ReportType.FOUND,
                    "location": f"{200 + index} Parkside Avenue, Sample District",
                    "last_seen_at": _aware_at(-index - 1, 15),
                    "resolved": index % 6 == 0,
                },
            )
            _get_or_create(
                Notification,
                {
                    "user": owner,
                    "title": f"{DEMO_PREFIX} Care update {index + 1:02d}",
                },
                {
                    "channel": Notification.Channel.IN_APP,
                    "body": f"A new pet-care update is ready for your family ({index + 1:02d}).",
                    "read_at": _aware_at(-index, 9) if index % 3 == 0 else None,
                    "sent_at": _aware_at(-index, 9),
                },
            )
        counts["payments.Transaction"] = 25
        counts["community.Post"] = 25
        counts["community.LostFound"] = 25
        counts["notifications.Notification"] = 25

        for index in range(25):
            marker = f"{DEMO_PREFIX} chat message {index + 1:02d}"
            message = Message.objects.filter(sender=owner, content=marker).select_related("chat").first()
            if message:
                chat = message.chat
            else:
                chat = Chat.objects.create()
                chat.participants.add(owner, members[index])
            _get_or_create(
                Message,
                {"chat": chat, "sender": owner, "content": marker},
                {
                    "read_at": _aware_at(-index, 12) if index % 2 == 0 else None,
                },
            )
        counts["messaging.Chat"] = 25
        counts["messaging.Message"] = 25

        for index in range(25):
            _get_or_create(
                AuditLog,
                {
                    "actor": owner,
                    "action": "demo.record.created",
                    "object_type": "demo",
                    "object_id": f"pawverse-demo-audit-{index + 1:04d}",
                },
                {
                    "details": {
                        "source": "seed_demo_data",
                        "summary": f"Fictional demo activity {index + 1:02d}.",
                    },
                },
            )
            _get_or_create(
                Approval,
                {
                    "requested_by": owner,
                    "subject_id": f"marketplace-listing-{index + 1:04d}",
                },
                {
                    "subject_type": "Marketplace listing",
                    "status": (
                        Approval.Status.APPROVED
                        if index % 4 == 0
                        else Approval.Status.PENDING
                    ),
                    "reviewed_by": None,
                    "notes": f"Marketplace listing {index + 1:02d} is awaiting review.",
                },
            )
            _get_or_create(
                Analytics,
                {"metric": f"pawverse_demo_metric_{index + 1:02d}"},
                {
                    "value": {
                        "value": 25 + index * 3,
                        "label": f"Fictional demo metric {index + 1:02d}",
                    },
                },
            )
        counts["administration.AuditLog"] = 25
        counts["administration.Approval"] = 25
        counts["administration.Analytics"] = 25
        return counts

    def _verify_api(self, owner):
        endpoint_paths = (
            "pets",
            "roles",
            "vaccinations",
            "medical-history",
            "vet-profiles",
            "vet-directory",
            "clinics",
            "appointments",
            "reminders",
            "adoption-listings",
            "adoption-applications",
            "rescue-cases",
            "volunteers",
            "listings",
            "inquiries",
            "services",
            "grooming",
            "sitting",
            "service-bookings",
            "transactions",
            "posts",
            "lost-found",
            "chats",
            "messages",
            "notifications",
            "admin/dashboard",
            "admin/approvals",
            "admin/audit-logs",
            "admin/analytics",
        )
        client = APIClient()
        client.force_authenticate(user=owner)
        counts = {}
        staff_endpoints = {
            "admin/dashboard",
            "admin/approvals",
            "admin/audit-logs",
            "admin/analytics",
        }
        for endpoint in endpoint_paths:
            response = client.get(f"/api/{endpoint}/", HTTP_HOST="localhost")
            if endpoint in staff_endpoints and not owner.is_staff:
                if response.status_code != 403:
                    raise CommandError(
                        f"API permission verification failed for /api/{endpoint}/ "
                        f"(expected HTTP 403, got {response.status_code})."
                    )
                counts[endpoint] = "staff-only (403 expected)"
                continue
            if response.status_code != 200:
                raise CommandError(
                    f"API verification failed for /api/{endpoint}/ "
                    f"(HTTP {response.status_code})."
                )
            payload = response.data
            if isinstance(payload, dict) and "count" in payload:
                count = payload["count"]
            elif isinstance(payload, list):
                count = len(payload)
            else:
                count = 0
            counts[endpoint] = count
        return counts
