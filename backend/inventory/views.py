from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import InventoryLot
from .serializers import InventoryLotSerializer


class InventoryLotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryLot.objects.select_related( "product").all()
    serializer_class = InventoryLotSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter,OrderingFilter, ]
    filterset_fields = ["product","expiry_date",]
    search_fields = ["product__code","product__name","lot_number",]
    ordering_fields = ["received_at","expiry_date","quantity",]
    ordering = ["received_at","id",]