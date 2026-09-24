import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface TaxComponent {
  id: number;
  compound_tax: number;
  compound_tax_name: string;
  component_tax: number;
  component_tax_name: string;
  sequence: number;
}

export interface Tax {
  id?: number;
  name: string;
  code: string;
  tax_type: 'SIMPLE' | 'COMPOUND';
  rate: string;
  is_active: boolean;
  components?: TaxComponent[];
}

export interface PaginatedTaxResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tax[];
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}

  getTaxes(): Observable<PaginatedTaxResponse> {
    return this.http.get<PaginatedTaxResponse>(
      this.api.getUrl('taxes/')
    );
  }

  createTax(tax: Tax): Observable<Tax> {
    return this.http.post<Tax>(
      this.api.getUrl('taxes/'),
      tax
    );
  }

  updateTax(
    id: number,
    tax: Partial<Tax>
  ): Observable<Tax> {
    return this.http.patch<Tax>(
      this.api.getUrl(`taxes/${id}/`),
      tax
    );
  }

  createComponent(data: {
  compound_tax: number;
  component_tax: number;
  sequence: number;
}): Observable<any> {
  return this.http.post(
    this.api.getUrl('tax-components/'),
    data
  );
}
}