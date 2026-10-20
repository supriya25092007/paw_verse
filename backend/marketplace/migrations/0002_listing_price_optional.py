import decimal

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0002_listing_image_url"),
    ]

    operations = [
        migrations.AlterField(
            model_name="listing",
            name="price",
            field=models.DecimalField(
                decimal_places=2,
                default=decimal.Decimal("0.00"),
                max_digits=10,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
    ]
