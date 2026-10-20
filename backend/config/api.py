from rest_framework import viewsets


class UserOwnedViewSet(viewsets.ModelViewSet):
    owner_field = "user"

    def get_queryset(self):
        return super().get_queryset().filter(
            **{self.owner_field: self.request.user}
        )

    def perform_create(self, serializer):
        serializer.save(**{self.owner_field: self.request.user})
