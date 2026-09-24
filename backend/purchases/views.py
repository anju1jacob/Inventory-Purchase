from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PurchaseVoucher
from .serializers import PurchaseVoucherSerializer
from .services import PurchasePostingService


class PurchaseVoucherViewSet(viewsets.ModelViewSet):
    queryset = PurchaseVoucher.objects.prefetch_related( "lines__product").all()
    serializer_class = PurchaseVoucherSerializer

    filterset_fields = ["status","invoice_date",]
    search_fields = ["voucher_number","supplier_name","invoice_number",]
    ordering_fields = ["created_at","invoice_date", "net_total",]

    def update(self, request, *args, **kwargs):
        voucher = self.get_object()

        if voucher.status == PurchaseVoucher.Status.POSTED:
            return Response(
                {
                    "detail": (
                        "Posted vouchers are immutable and cannot be edited."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        voucher = self.get_object()

        if voucher.status == PurchaseVoucher.Status.POSTED:
            return Response(
                {
                    "detail": (
                        "Posted vouchers are immutable and cannot be edited."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        voucher = self.get_object()

        if voucher.status == PurchaseVoucher.Status.POSTED:
            return Response(
                {
                    "detail": (
                        "Posted vouchers are immutable and cannot be deleted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["post"],
        url_path="post",
    )
    def post_voucher(self, request, pk=None):
        try:
            voucher = PurchasePostingService.post(pk)

        except PurchaseVoucher.DoesNotExist:
            return Response(
                {"detail": "Purchase voucher not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            PurchaseVoucherSerializer(voucher).data,
            status=status.HTTP_200_OK,
        )