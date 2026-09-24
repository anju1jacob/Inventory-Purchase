import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface Product {
  id?: number;
  code: string;
  name: string;
  category: string;
  cost_price: string;
  selling_price: string;
  tax: number | null;
  tax_name?: string;
  is_lot_controlled: boolean;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}

  getProducts(): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(
      this.api.getUrl('products/')
    );
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(
      this.api.getUrl('products/'),
      product
    );
  }

  updateProduct(
    id: number,
    product: Partial<Product>
  ): Observable<Product> {
    return this.http.patch<Product>(
      this.api.getUrl(`products/${id}/`),
      product
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(
      this.api.getUrl(`products/${id}/`)
    );
  }
}