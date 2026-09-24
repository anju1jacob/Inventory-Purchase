import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PurchaseLine {
  id?: number;

  product: number;

  product_name?: string;
  product_code?: string;

  quantity: string;
  unit_cost: string;
  discount: string;

  line_subtotal?: string;
  tax_amount?: string;
  line_total?: string;

  lot_number?: string | null;
  expiry_date?: string | null;

  tax_snapshot?: any;
}

export interface PurchaseVoucher {
  id?: number;

  voucher_number: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;

  status?: 'DRAFT' | 'POSTED';

  subtotal?: string;
  discount_total?: string;
  tax_total?: string;
  net_total?: string;

  lines: PurchaseLine[];

  created_at?: string;
  updated_at?: string;
  posted_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}


  getVouchers(): Observable<any> {

    return this.http.get(
      this.api.getUrl('purchase-vouchers/')
    );

  }


  getVoucher(
    id: number
  ): Observable<PurchaseVoucher> {

    return this.http.get<PurchaseVoucher>(
      this.api.getUrl(`purchase-vouchers/${id}/`)
    );

  }


  createVoucher(
    voucher: PurchaseVoucher
  ): Observable<PurchaseVoucher> {

    return this.http.post<PurchaseVoucher>(
      this.api.getUrl('purchase-vouchers/'),
      voucher
    );

  }


  updateVoucher(
    id: number,
    voucher: PurchaseVoucher
  ): Observable<PurchaseVoucher> {

    return this.http.patch<PurchaseVoucher>(
      this.api.getUrl(`purchase-vouchers/${id}/`),
      voucher
    );

  }


  postVoucher(
    id: number
  ): Observable<PurchaseVoucher> {

    return this.http.post<PurchaseVoucher>(
      this.api.getUrl(`purchase-vouchers/${id}/post/`),
      {}
    );

  }

}