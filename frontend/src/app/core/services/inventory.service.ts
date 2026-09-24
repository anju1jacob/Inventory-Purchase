import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface InventoryLot {
  id: number;
  product: number;
  product_code: string;
  product_name: string;
  lot_number: string | null;
  expiry_date: string | null;
  quantity: string;
  usable_quantity: string;
  is_expired: boolean;
  received_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}

  getInventory(): Observable<any> {
    return this.http.get(
      this.api.getUrl('inventory/')
    );
  }

  getSummary(): Observable<any> {
    return this.http.get(
      this.api.getUrl('inventory/summary/')
    );
  }
}