import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  readonly baseUrl = 'http://127.0.0.1:8000/api';

  getUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }
}