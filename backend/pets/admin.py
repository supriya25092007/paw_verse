from django.contrib import admin

from pets.models import Pet


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("name", "species", "owner", "created_at")
    list_filter = ("species", "sex")
    search_fields = ("name", "owner__email", "microchip_number")
