from config.api import UserOwnedViewSet
from payments.models import Transaction
from payments.serializers import TransactionSerializer


class TransactionViewSet(UserOwnedViewSet):
    queryset = Transaction.objects.select_related("user")
    serializer_class = TransactionSerializer
    http_method_names = ("get", "head", "options")
