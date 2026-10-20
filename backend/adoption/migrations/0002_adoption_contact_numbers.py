from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("adoption", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="listing",
            name="contact_number",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="application",
            name="contact_number",
            field=models.CharField(blank=True, max_length=32),
        ),
    ]
