from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("veterinary", "0003_vetprofile_address"),
    ]

    operations = [
        migrations.AddField(
            model_name="vetprofile",
            name="contact_number",
            field=models.CharField(blank=True, max_length=32),
        ),
    ]
