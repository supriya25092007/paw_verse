from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.test import TestCase


User = get_user_model()


class SetStaffAccessCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="member@example.test",
            password="a-test-password",
        )

    def test_grants_staff_access_without_granting_superuser_access(self):
        call_command("set_staff_access", self.user.email, stdout=StringIO())

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)

    def test_revokes_staff_access(self):
        self.user.is_staff = True
        self.user.save(update_fields=("is_staff",))

        call_command("set_staff_access", self.user.email, revoke=True, stdout=StringIO())

        self.user.refresh_from_db()
        self.assertFalse(self.user.is_staff)

    def test_unknown_account_is_reported(self):
        with self.assertRaisesMessage(CommandError, "No account exists"):
            call_command("set_staff_access", "missing@example.test", stdout=StringIO())

    def test_cannot_revoke_staff_access_from_superuser(self):
        self.user.is_staff = True
        self.user.is_superuser = True
        self.user.save(update_fields=("is_staff", "is_superuser"))

        with self.assertRaisesMessage(CommandError, "cannot be revoked from a superuser"):
            call_command("set_staff_access", self.user.email, revoke=True, stdout=StringIO())
