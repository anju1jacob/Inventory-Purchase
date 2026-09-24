from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PurchaseVoucher
from .serializers import PurchaseVoucherSerializer


class PurchaseVoucherViewSet(viewsets.ModelViewSet):
    queryset = (PurchaseVoucher.objects.prefetch_related("lines__product", ).all())
    serializer_class = PurchaseVoucherSerializer
    filterset_fields = ["status","invoice_date",]
    search_fields = ["voucher_number", "supplier_name","invoice_number", ]
    ordering_fields = ["created_at","invoice_date", "net_total",]

    @action(
        detail=True,
        methods=["post"],
        url_path="post",
    )
    def post_voucher(self, request, pk=None):
        voucher = self.get_object()
        if voucher.status == PurchaseVoucher.Status.POSTED:
            return Response(
                {
                    "detail": (
                        "This voucher has already been posted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Posting service will be implemented next.
        return Response(
            {
                "detail": (
                    "Voucher posting service is not implemented yet."
                )
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )