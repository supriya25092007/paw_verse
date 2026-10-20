from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class MarketplaceListingImageTests(APITestCase):
    def test_authenticated_seller_can_create_listing_with_image_url(self):
        seller = User.objects.create_user(
            email="seller@example.test",
            password="a-safe-test-password",
        )
        self.client.force_authenticate(seller)

        response = self.client.post(
            "/api/listings/",
            {
                "title": "Demo harness",
                "description": "An adjustable walking harness.",
                "price": "24.50",
                "category": "accessories",
                "image_url": "/demo-products/trail-harness.svg",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["image_url"], "/demo-products/trail-harness.svg")

    def test_authenticated_seller_can_create_listing_without_price(self):
        seller = User.objects.create_user(
            email="no-price-seller@example.test",
            password="A-strong-password-892!",
        )
        self.client.force_authenticate(seller)

        response = self.client.post(
            "/api/listings/",
            {
                "title": "Adjustable pet harness",
                "description": "An adjustable walking harness.",
                "category": "accessories",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["price"], "0.00")
