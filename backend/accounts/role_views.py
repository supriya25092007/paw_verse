from django.db.models import Q
from rest_framework import permissions, viewsets

from accounts.models import Role
from accounts.role_serializers import RoleSerializer


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.exclude(
        Q(name__istartswith="sample role")
        | Q(code__istartswith="sample-role")
        | Q(description__icontains="pawverse demo role")
    )
    serializer_class = RoleSerializer
    permission_classes = (permissions.IsAuthenticated,)
