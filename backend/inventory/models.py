from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class InventoryLot(models.Model):
    product = models.ForeignKey("catalog.Product",on_delete=models.PROTECT, related_name="inventory_lots",)
    lot_number = models.CharField(max_length=100,null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    quantity = models.DecimalField( max_digits=12,decimal_places=3,default=0,validators=[MinValueValidator(0)],)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["received_at", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "lot_number"],
                condition=Q(lot_number__isnull=False),
                name="unique_product_lot",
            ),
            models.UniqueConstraint(
                fields=["product"],
                condition=Q(lot_number__isnull=True),
                name="unique_product_without_lot",
            ),
        ]

    def __str__(self):
        lot = self.lot_number or "NO-LOT"
        return f"{self.product.code} - {lot}"