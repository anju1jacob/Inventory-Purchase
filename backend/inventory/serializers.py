from django.utils import timezone
from rest_framework import serializers

from .models import InventoryLot


class InventoryLotSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name",read_only=True,)
    product_code = serializers.CharField(source="product.code",read_only=True,)
    usable_quantity = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = InventoryLot
        fields = [
            "id",
            "product",
            "product_code",
            "product_name",
            "lot_number",
            "expiry_date",
            "quantity",
            "usable_quantity",
            "is_expired",
            "received_at",
        ]

    def get_is_expired(self, obj):
        if obj.expiry_date is None:
            return False

        return obj.expiry_date < timezone.localdate()

    def get_usable_quantity(self, obj):
        if obj.expiry_date is not None:
            if obj.expiry_date < timezone.localdate():
                return 0

        return obj.quantity