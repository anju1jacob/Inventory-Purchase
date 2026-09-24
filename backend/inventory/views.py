from decimal import Decimal
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from django.utils import timezone
from .models import InventoryLot
from .serializers import InventoryLotSerializer


class InventoryLotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryLot.objects.select_related("product").all()
    serializer_class = InventoryLotSerializer
    filter_backends = [DjangoFilterBackend,SearchFilter,OrderingFilter,]
    filterset_fields = ["product", "expiry_date",]
    search_fields = ["product__code", "product__name","lot_number",]
    ordering_fields = ["received_at","expiry_date","quantity",]
    ordering = ["received_at", "id",]

    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
    )
    def summary(self, request):
        lots = self.get_queryset()

        total_quantity = Decimal("0")
        usable_quantity = Decimal("0")
        today = timezone.localdate()
        for lot in lots:
            total_quantity += lot.quantity

            if (
                lot.expiry_date is None
                or lot.expiry_date >= today
            ):
                usable_quantity += lot.quantity

        return Response({
            "total_quantity": total_quantity,
            "usable_quantity": usable_quantity,
            "lot_count": lots.count(),
        })