from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from .models import Product, Tax, TaxComponent
from .serializers import (
    ProductSerializer,
    TaxComponentSerializer,
    TaxSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("tax").all()
    serializer_class = ProductSerializer

    filter_backends = [
        DjangoFilterBackend,
    ]

    filterset_fields = [
        "is_active",
        "is_lot_controlled",
        "category",
        "tax",
    ]


class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.prefetch_related(
        "components__component_tax"
    ).all()
    serializer_class = TaxSerializer

    filter_backends = [
        DjangoFilterBackend,
    ]

    filterset_fields = [
        "is_active",
        "tax_type",
    ]


class TaxComponentViewSet(viewsets.ModelViewSet):
    queryset = TaxComponent.objects.select_related(
        "compound_tax",
        "component_tax",
    ).all()
    serializer_class = TaxComponentSerializer