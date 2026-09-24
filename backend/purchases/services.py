from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from inventory.models import InventoryLot
from .models import PurchaseVoucher


MONEY_PLACES = Decimal("0.01")

def money(value):
    return Decimal(value).quantize(MONEY_PLACES,rounding=ROUND_HALF_UP,)

class PurchasePostingService:

    @classmethod
    @transaction.atomic
    def post(cls, voucher_id):
        """
        Finalize a purchase voucher and update inventory atomically.
        """

        voucher = (PurchaseVoucher.objects.select_for_update()
            .prefetch_related("lines__product__tax__components__component_tax").get(pk=voucher_id))
        if voucher.status == PurchaseVoucher.Status.POSTED:
            raise ValidationError(
                {"detail": "This voucher has already been posted."}
            )
        lines = list(voucher.lines.all())
        if not lines:
            raise ValidationError(
                {"detail": "A voucher must contain at least one line."}
            )
        today = timezone.localdate()

        subtotal = Decimal("0")
        discount_total = Decimal("0")
        tax_total = Decimal("0")

        seen_product_lots = set()

        # -----------------------------------------
        # Validate and calculate all lines first
        # -----------------------------------------
        calculated_lines = []

        for line in lines:
            product = line.product

            if not product.is_active:
                raise ValidationError({
                    "detail": (
                        f"Inactive product '{product.name}' "
                        "cannot be purchased."
                    )
                })

            if line.quantity <= 0:
                raise ValidationError({
                    "detail": f"Quantity must be greater than zero for '{product.name}'."
                })

            if line.unit_cost < 0:
                raise ValidationError({
                    "detail": f"Unit cost cannot be negative for '{product.name}'."
                })

            gross_amount = money(line.quantity * line.unit_cost)

            if line.discount < 0:
                raise ValidationError({
                    "detail": f"Discount cannot be negative for '{product.name}'."
                })

            if line.discount > gross_amount:
                raise ValidationError({
                    "detail": (
                        f"Discount cannot exceed gross amount "
                        f"for '{product.name}'."
                    )
                })

            # -----------------------------------------
            # Lot validation
            # -----------------------------------------
            if product.is_lot_controlled:

                if not line.lot_number:
                    raise ValidationError({
                        "detail": (
                            f"Lot number is required for "
                            f"'{product.name}'."
                        )
                    })

                if not line.expiry_date:
                    raise ValidationError({
                        "detail": (
                            f"Expiry date is required for "
                            f"'{product.name}'."
                        )
                    })

                if line.expiry_date < voucher.invoice_date:
                    raise ValidationError({
                        "detail": (
                            f"Expiry date for '{product.name}' "
                            "cannot be before invoice date."
                        )
                    })

                if line.expiry_date < today:
                    raise ValidationError({
                        "detail": (
                            f"Lot '{line.lot_number}' for "
                            f"'{product.name}' is already expired."
                        )
                    })

                product_lot_key = (
                    product.id,
                    line.lot_number,
                )

                if product_lot_key in seen_product_lots:
                    raise ValidationError({
                        "detail": (
                            f"Product '{product.name}' with lot "
                            f"'{line.lot_number}' appears more than once."
                        )
                    })

                seen_product_lots.add(product_lot_key)

                # Same lot cannot be received again.
                if InventoryLot.objects.filter(
                    product=product,
                    lot_number=line.lot_number,
                ).exists():
                    raise ValidationError({
                        "detail": (
                            f"Lot '{line.lot_number}' for "
                            f"'{product.name}' already exists in inventory."
                        )
                    })

            else:
                if line.lot_number or line.expiry_date:
                    raise ValidationError({
                        "detail": (
                            f"Lot information should not be provided "
                            f"for non-lot-controlled product "
                            f"'{product.name}'."
                        )
                    })

                product_lot_key = (product.id, None)

                if product_lot_key in seen_product_lots:
                    raise ValidationError({
                        "detail": (
                            f"Product '{product.name}' appears "
                            "more than once in this voucher."
                        )
                    })

                seen_product_lots.add(product_lot_key)

            # -----------------------------------------
            # Tax calculation
            # -----------------------------------------
            tax_snapshot, effective_tax_rate = cls.build_tax_snapshot(
                product
            )

            taxable_amount = money(
                gross_amount - line.discount
            )

            tax_amount = money(
                taxable_amount * effective_tax_rate / Decimal("100")
            )

            line_total = money(
                taxable_amount + tax_amount
            )

            calculated_lines.append({
                "line": line,
                "gross_amount": gross_amount,
                "taxable_amount": taxable_amount,
                "tax_amount": tax_amount,
                "line_total": line_total,
                "tax_snapshot": tax_snapshot,
            })

            subtotal += gross_amount
            discount_total += line.discount
            tax_total += tax_amount

        # -----------------------------------------
        # Calculate voucher totals
        # -----------------------------------------
        subtotal = money(subtotal)
        discount_total = money(discount_total)
        tax_total = money(tax_total)

        net_total = money(
            subtotal - discount_total + tax_total
        )

        # -----------------------------------------
        # Save calculated lines
        # -----------------------------------------
        for item in calculated_lines:
            line = item["line"]

            line.line_subtotal = item["gross_amount"]
            line.tax_amount = item["tax_amount"]
            line.line_total = item["line_total"]
            line.tax_snapshot = item["tax_snapshot"]

            line.save(
                update_fields=[
                    "line_subtotal",
                    "tax_amount",
                    "line_total",
                    "tax_snapshot",
                ]
            )

        # -----------------------------------------
        # Update inventory
        # -----------------------------------------
        for item in calculated_lines:
            line = item["line"]
            product = line.product

            if product.is_lot_controlled:
                InventoryLot.objects.create(
                    product=product,
                    lot_number=line.lot_number,
                    expiry_date=line.expiry_date,
                    quantity=line.quantity,
                )

            else:
                inventory, created = (
                    InventoryLot.objects
                    .select_for_update()
                    .get_or_create(
                        product=product,
                        lot_number=None,
                        defaults={
                            "quantity": Decimal("0")
                        },
                    )
                )

                inventory.quantity += line.quantity
                inventory.save(update_fields=["quantity"])

        # -----------------------------------------
        # Finalize voucher
        # -----------------------------------------
        voucher.subtotal = subtotal
        voucher.discount_total = discount_total
        voucher.tax_total = tax_total
        voucher.net_total = net_total
        voucher.status = PurchaseVoucher.Status.POSTED
        voucher.posted_at = timezone.now()

        voucher.save(
            update_fields=[
                "subtotal",
                "discount_total",
                "tax_total",
                "net_total",
                "status",
                "posted_at",
                "updated_at",
            ]
        )

        return voucher

    @staticmethod
    def build_tax_snapshot(product):
        """
        Capture the tax definition used at posting time.

        Historical purchase lines keep this snapshot even if
        the tax configuration changes later.
        """

        tax = product.tax

        if tax is None:
            return {
                "tax_id": None,
                "code": None,
                "name": None,
                "tax_type": None,
                "rate": "0.00",
                "effective_rate": "0.00",
                "components": [],
            }, Decimal("0")

        if not tax.is_active:
            raise ValidationError({
                "detail": (
                    f"Tax '{tax.name}' is inactive and cannot "
                    "be used for a new purchase."
                )
            })

        if tax.tax_type == "SIMPLE":
            effective_rate = tax.rate

            snapshot = {
                "tax_id": tax.id,
                "code": tax.code,
                "name": tax.name,
                "tax_type": tax.tax_type,
                "rate": str(tax.rate),
                "effective_rate": str(effective_rate),
                "components": [],
            }

            return snapshot, effective_rate

        # Compound tax
        components = list(
            tax.components
            .select_related("component_tax")
            .order_by("sequence")
        )

        component_data = []
        effective_rate = Decimal("0")

        for component in components:
            component_tax = component.component_tax

            if not component_tax.is_active:
                raise ValidationError({
                    "detail": (
                        f"Tax component '{component_tax.name}' "
                        "is inactive."
                    )
                })

            effective_rate += component_tax.rate

            component_data.append({
                "tax_id": component_tax.id,
                "code": component_tax.code,
                "name": component_tax.name,
                "rate": str(component_tax.rate),
                "sequence": component.sequence,
            })

        snapshot = {
            "tax_id": tax.id,
            "code": tax.code,
            "name": tax.name,
            "tax_type": tax.tax_type,
            "rate": str(effective_rate),
            "effective_rate": str(effective_rate),
            "components": component_data,
        }

        return snapshot, effective_rate