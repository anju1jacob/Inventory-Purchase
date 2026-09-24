import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface PurchaseLine {
  product: number;
  quantity: string;
  unit_cost: string;
  discount: string;
  lot_number?: string | null;
  expiry_date?: string | null;
}

export interface PurchaseVoucher {
  id?: number;
  voucher_number: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  status?: string;
  subtotal?: string;
  discount_total?: string;
  tax_total?: string;
  net_total?: string;
  lines: PurchaseLine[];
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

  createVoucher(
    voucher: PurchaseVoucher
  ): Observable<PurchaseVoucher> {
    return this.http.post<PurchaseVoucher>(
      this.api.getUrl('purchase-vouchers/'),
      voucher
    );
  }

  getVoucher(id: number): Observable<PurchaseVoucher> {
    return this.http.get<PurchaseVoucher>(
      this.api.getUrl(`purchase-vouchers/${id}/`)
    );
  }

  postVoucher(id: number): Observable<PurchaseVoucher> {
    return this.http.post<PurchaseVoucher>(
      this.api.getUrl(`purchase-vouchers/${id}/post/`),
      {}
    );
  }
}