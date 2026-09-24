from django.core.validators import MinValueValidator
from django.db import models


class PurchaseVoucher(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        POSTED = "POSTED", "Posted"
    voucher_number = models.CharField(max_length=50,unique=True,)
    supplier_name = models.CharField(max_length=150,)
    invoice_number = models.CharField( max_length=100,)
    invoice_date = models.DateField()
    status = models.CharField(max_length=20,choices=Status.choices,default=Status.DRAFT,)
    subtotal = models.DecimalField(max_digits=14,decimal_places=2,default=0,validators=[MinValueValidator(0)],)
    discount_total = models.DecimalField(max_digits=14,decimal_places=2,default=0,validators=[MinValueValidator(0)],)
    tax_total = models.DecimalField(max_digits=14,decimal_places=2,default=0,validators=[MinValueValidator(0)],)
    net_total = models.DecimalField(max_digits=14,decimal_places=2,default=0,validators=[MinValueValidator(0)],)
    created_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True,)
    posted_at = models.DateTimeField(null=True,blank=True,)
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.voucher_number


class PurchaseVoucherLine(models.Model):
    voucher = models.ForeignKey(PurchaseVoucher,on_delete=models.CASCADE,related_name="lines",)
    product = models.ForeignKey("catalog.Product",on_delete=models.PROTECT,related_name="purchase_lines",)
    quantity = models.DecimalField(max_digits=12,decimal_places=3,validators=[MinValueValidator(0.001)],)
    unit_cost = models.DecimalField(max_digits=12,decimal_places=2,validators=[MinValueValidator(0)])
    discount = models.DecimalField(max_digits=12,decimal_places=2,default=0,validators=[MinValueValidator(0)],)
    line_subtotal = models.DecimalField(max_digits=14,decimal_places=2,default=0,)
    tax_amount = models.DecimalField(max_digits=14,decimal_places=2,default=0,)
    line_total = models.DecimalField(max_digits=14, decimal_places=2,default=0,)
    lot_number = models.CharField(max_length=100,null=True,blank=True,)
    expiry_date = models.DateField(null=True,blank=True,)
    tax_snapshot = models.JSONField(default=dict,blank=True,)
    created_at = models.DateTimeField(auto_now_add=True,)
    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.voucher.voucher_number} - {self.product.name}"