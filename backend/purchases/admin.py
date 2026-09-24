from django.contrib import admin

from .models import PurchaseVoucher, PurchaseVoucherLine


class PurchaseVoucherLineInline(admin.TabularInline):
    model = PurchaseVoucherLine
    extra = 0
    readonly_fields = (
        "line_subtotal",
        "tax_amount",
        "line_total",
    )


@admin.register(PurchaseVoucher)
class PurchaseVoucherAdmin(admin.ModelAdmin):
    list_display = (
        "voucher_number",
        "supplier_name",
        "invoice_number",
        "invoice_date",
        "status",
        "net_total",
        "created_at",
        "posted_at",
    )

    list_filter = (
        "status",
        "invoice_date",
    )

    search_fields = (
        "voucher_number",
        "supplier_name",
        "invoice_number",
    )

    readonly_fields = (
        "subtotal",
        "discount_total",
        "tax_total",
        "net_total",
        "posted_at",
    )

    inlines = [
        PurchaseVoucherLineInline,
    ]


@admin.register(PurchaseVoucherLine)
class PurchaseVoucherLineAdmin(admin.ModelAdmin):
    list_display = (
        "voucher",
        "product",
        "quantity",
        "unit_cost",
        "discount",
        "tax_amount",
        "line_total",
        "lot_number",
        "expiry_date",
    )

    list_filter = (
        "product",
        "expiry_date",
    )

    search_fields = (
        "voucher__voucher_number",
        "product__code",
        "product__name",
        "lot_number",
    )