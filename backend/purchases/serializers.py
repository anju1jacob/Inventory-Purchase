from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from catalog.models import Product
from .models import PurchaseVoucher, PurchaseVoucherLine


class PurchaseVoucherLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name",read_only=True,)
    product_code = serializers.CharField(source="product.code",read_only=True)

    class Meta:
        model = PurchaseVoucherLine
        fields = ["id","product","product_name","product_code","quantity","unit_cost","discount",
            "line_subtotal","tax_amount","line_total","lot_number","expiry_date","tax_snapshot",]
        read_only_fields = ["id","line_subtotal", "tax_amount","line_total","tax_snapshot",]

    def validate(self, attrs):
        product = attrs["product"]
        quantity = attrs["quantity"]
        unit_cost = attrs["unit_cost"]
        discount = attrs.get("discount", Decimal("0"))

        if not product.is_active:
            raise serializers.ValidationError(
                {
                    "product": (
                        "Inactive products cannot be purchased."
                    )
                }
            )

        if quantity <= 0:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Quantity must be greater than zero."
                    )
                }
            )

        if unit_cost < 0:
            raise serializers.ValidationError(
                {
                    "unit_cost": (
                        "Unit cost cannot be negative."
                    )
                }
            )

        gross_amount = quantity * unit_cost

        if discount < 0:
            raise serializers.ValidationError(
                {
                    "discount": (
                        "Discount cannot be negative."
                    )
                }
            )

        if discount > gross_amount:
            raise serializers.ValidationError(
                {
                    "discount": (
                        "Discount cannot exceed the gross amount."
                    )
                }
            )

        return attrs


class PurchaseVoucherSerializer(serializers.ModelSerializer):
    lines = PurchaseVoucherLineSerializer(
        many=True,
        required=True,
    )

    class Meta:
        model = PurchaseVoucher
        fields = [
            "id",
            "voucher_number",
            "supplier_name",
            "invoice_number",
            "invoice_date",
            "status",
            "subtotal",
            "discount_total",
            "tax_total",
            "net_total",
            "lines",
            "created_at",
            "updated_at",
            "posted_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "subtotal",
            "discount_total",
            "tax_total",
            "net_total",
            "created_at",
            "updated_at",
            "posted_at",
        ]

    def validate(self, attrs):
        lines = attrs.get("lines", [])

        if not lines:
            raise serializers.ValidationError(
                {
                    "lines": (
                        "At least one purchase line is required."
                    )
                }
            )

        invoice_date = attrs.get("invoice_date")

        for line in lines:
            product = line["product"]
            lot_number = line.get("lot_number")
            expiry_date = line.get("expiry_date")

            if product.is_lot_controlled:
                if not lot_number:
                    raise serializers.ValidationError(
                        {
                            "lines": (
                                f"Lot number is required for "
                                f"lot-controlled product "
                                f"'{product.name}'."
                            )
                        }
                    )

                if not expiry_date:
                    raise serializers.ValidationError(
                        {
                            "lines": (
                                f"Expiry date is required for "
                                f"lot-controlled product "
                                f"'{product.name}'."
                            )
                        }
                    )

                if expiry_date < invoice_date:
                    raise serializers.ValidationError(
                        {
                            "lines": (
                                f"Expiry date for '{product.name}' "
                                f"cannot be before the invoice date."
                            )
                        }
                    )

            else:
                if lot_number or expiry_date:
                    raise serializers.ValidationError(
                        {
                            "lines": (
                                f"Lot information should not be "
                                f"provided for non-lot-controlled "
                                f"product '{product.name}'."
                            )
                        }
                    )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        lines_data = validated_data.pop("lines")

        voucher = PurchaseVoucher.objects.create(
            **validated_data
        )

        for line_data in lines_data:
            PurchaseVoucherLine.objects.create(
                voucher=voucher,
                **line_data,
            )

        return voucher