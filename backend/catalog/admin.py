from django.contrib import admin

from .models import Product, Tax, TaxComponent


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "category",
        "cost_price",
        "selling_price",
        "tax",
        "is_lot_controlled",
        "is_active",
    )
    list_filter = ("is_active", "is_lot_controlled", "category")
    search_fields = ("code", "name")


@admin.register(Tax)
class TaxAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "tax_type",
        "rate",
        "is_active",
    )
    list_filter = ("tax_type", "is_active")
    search_fields = ("code", "name")


@admin.register(TaxComponent)
class TaxComponentAdmin(admin.ModelAdmin):
    list_display = (
        "compound_tax",
        "component_tax",
        "sequence",
    )
    list_filter = ("compound_tax",)