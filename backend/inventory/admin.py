from django.contrib import admin

from .models import InventoryLot


@admin.register(InventoryLot)
class InventoryLotAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "lot_number",
        "expiry_date",
        "quantity",
        "received_at",
    )

    list_filter = (
        "expiry_date",
        "product",
    )

    search_fields = (
        "product__code",
        "product__name",
        "lot_number",
    )

    readonly_fields = (
        "received_at",
    )