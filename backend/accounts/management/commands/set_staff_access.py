from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


User = get_user_model()


class Command(BaseCommand):
    help = "Grant or revoke Django staff access for an existing account by email."

    def add_arguments(self, parser):
        parser.add_argument("email", help="Email address of the existing account.")
        parser.add_argument(
            "--revoke",
            action="store_true",
            help="Remove staff access instead of granting it.",
        )

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        if not email:
            raise CommandError("An account email address is required.")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as error:
            raise CommandError(f"No account exists for {email}.") from error
        except User.MultipleObjectsReturned as error:
            raise CommandError(
                f"More than one account matches {email}; resolve duplicate emails first."
            ) from error

        if not user.is_active:
            raise CommandError(f"The account {user.email} is inactive.")

        grant_access = not options["revoke"]
        if not grant_access and user.is_superuser:
            raise CommandError(
                "Staff access cannot be revoked from a superuser. "
                "Remove superuser access explicitly first."
            )

        if user.is_staff == grant_access:
            state = "already has" if grant_access else "does not have"
            self.stdout.write(f"{user.email} {state} staff access.")
            return

        user.is_staff = grant_access
        user.save(update_fields=("is_staff",))
        action = "Granted" if grant_access else "Revoked"
        self.stdout.write(self.style.SUCCESS(f"{action} staff access for {user.email}."))
