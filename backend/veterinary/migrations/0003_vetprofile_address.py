from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("veterinary", "0002_vetprofile_bio_vetprofile_is_verified_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="vetprofile",
            name="address",
            field=models.TextField(blank=True, default=""),
        ),
    ]
