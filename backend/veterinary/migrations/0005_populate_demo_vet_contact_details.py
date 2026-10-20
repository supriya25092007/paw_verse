import re

from django.db import migrations


def populate_demo_vet_contact_details(apps, schema_editor):
    VetProfile = apps.get_model("veterinary", "VetProfile")
    database = schema_editor.connection.alias

    profiles = VetProfile.objects.using(database).filter(
        user__email__startswith="demo.vet."
    ).select_related("user")
    for profile in profiles.iterator():
        match = re.fullmatch(
            r"demo\.vet\.(\d{2})@pawverse\.example",
            profile.user.email,
            flags=re.IGNORECASE,
        )
        if not match:
            continue

        index = int(match.group(1))
        updates = []
        if not profile.address:
            profile.address = f"{100 + index} Garden Lane, Sample District"
            updates.append("address")
        if not profile.contact_number:
            profile.contact_number = f"+1-555-010-{index:02d}"
            updates.append("contact_number")
        if updates:
            profile.save(using=database, update_fields=updates)


class Migration(migrations.Migration):

    dependencies = [
        ("veterinary", "0004_vetprofile_contact_number"),
    ]

    operations = [
        migrations.RunPython(
            populate_demo_vet_contact_details,
            migrations.RunPython.noop,
        ),
    ]
