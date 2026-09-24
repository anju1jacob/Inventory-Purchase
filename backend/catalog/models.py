from django.core.validators import MinValueValidator
from django.db import models


class Tax(models.Model):
    class TaxType(models.TextChoices):
        SIMPLE = "SIMPLE", "Simple"
        COMPOUND = "COMPOUND", "Compound"

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=30, unique=True)
    tax_type = models.CharField(max_length=20,choices=TaxType.choices,default=TaxType.SIMPLE)
    rate = models.DecimalField(max_digits=7,decimal_places=2,validators=[MinValueValidator(0)],help_text="Percentage rate for simple taxes.",)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.rate}%)"


class TaxComponent(models.Model):
    compound_tax = models.ForeignKey(Tax,on_delete=models.PROTECT,related_name="components",)
    component_tax = models.ForeignKey(Tax,on_delete=models.PROTECT,related_name="used_in_compounds",)
    sequence = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["compound_tax", "component_tax"],
                name="unique_tax_component",
            )
        ]

    def __str__(self):
        return f"{self.compound_tax.name} -> {self.component_tax.name}"


class Product(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    cost_price = models.DecimalField(max_digits=12,decimal_places=2,validators=[MinValueValidator(0)],)
    selling_price = models.DecimalField(max_digits=12,decimal_places=2,validators=[MinValueValidator(0)],)
    tax = models.ForeignKey(Tax,on_delete=models.PROTECT,related_name="products",null=True,blank=True,)
    is_lot_controlled = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"