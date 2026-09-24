from rest_framework import serializers

from .models import Product, Tax, TaxComponent


class TaxComponentSerializer(serializers.ModelSerializer):
    component_tax_name = serializers.CharField(
        source="component_tax.name",
        read_only=True,
    )
    compound_tax_name = serializers.CharField(
        source="compound_tax.name",
        read_only=True,
    )

    class Meta:
        model = TaxComponent
        fields = [
            "id",
            "compound_tax",
            "compound_tax_name",
            "component_tax",
            "component_tax_name",
            "sequence",
        ]

    def validate(self, attrs):
        compound_tax = attrs.get("compound_tax")
        component_tax = attrs.get("component_tax")

        if compound_tax is None:
            raise serializers.ValidationError(
                {
                    "compound_tax": "A compound tax is required."
                }
            )

        if component_tax is None:
            raise serializers.ValidationError(
                {
                    "component_tax": "A component tax is required."
                }
            )

        if compound_tax.tax_type != Tax.TaxType.COMPOUND:
            raise serializers.ValidationError(
                {
                    "compound_tax": (
                        "The selected tax must be a compound tax."
                    )
                }
            )

        if component_tax.tax_type != Tax.TaxType.SIMPLE:
            raise serializers.ValidationError(
                {
                    "component_tax": (
                        "A tax component must be a simple tax."
                    )
                }
            )

        if compound_tax == component_tax:
            raise serializers.ValidationError(
                {
                    "component_tax": (
                        "A tax cannot be a component of itself."
                    )
                }
            )

        return attrs


class TaxSerializer(serializers.ModelSerializer):
    components = TaxComponentSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Tax
        fields = [
            "id",
            "name",
            "code",
            "tax_type",
            "rate",
            "is_active",
            "components",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        tax_type = attrs.get(
            "tax_type",
            getattr(
                self.instance,
                "tax_type",
                Tax.TaxType.SIMPLE,
            ),
        )

        rate = attrs.get(
            "rate",
            getattr(self.instance, "rate", 0),
        )

        if tax_type == Tax.TaxType.COMPOUND and rate != 0:
            raise serializers.ValidationError(
                {
                    "rate": (
                        "Compound taxes should have a rate of 0. "
                        "Rates are defined by their components."
                    )
                }
            )

        return attrs


class ProductSerializer(serializers.ModelSerializer):
    tax_name = serializers.CharField(
        source="tax.name",
        read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "code",
            "name",
            "category",
            "cost_price",
            "selling_price",
            "tax",
            "tax_name",
            "is_lot_controlled",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        cost_price = attrs.get(
            "cost_price",
            getattr(self.instance, "cost_price", None),
        )

        selling_price = attrs.get(
            "selling_price",
            getattr(self.instance, "selling_price", None),
        )

        if (
            cost_price is not None
            and selling_price is not None
            and selling_price < cost_price
        ):
            raise serializers.ValidationError(
                {
                    "selling_price": (
                        "Selling price cannot be lower than cost price."
                    )
                }
            )

        return attrs