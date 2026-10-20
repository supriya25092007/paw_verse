from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("A superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("A superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.SlugField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        PET_OWNER = "pet_owner", "Pet owner"
        VETERINARIAN = "veterinarian", "Veterinarian"
        CLINIC_STAFF = "clinic_staff", "Clinic staff"
        SHELTER_STAFF = "shelter_staff", "Shelter staff"
        SERVICE_PROVIDER = "service_provider", "Service provider"

    username = None
    email = models.EmailField(unique=True)
    profile_photo = models.ImageField(
        upload_to="profile_photos/",
        blank=True,
        null=True,
    )
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.PET_OWNER,
    )
    roles = models.ManyToManyField("accounts.Role", blank=True, related_name="users")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
