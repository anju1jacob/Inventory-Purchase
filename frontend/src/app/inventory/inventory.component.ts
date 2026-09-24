import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  InventoryLot,
  InventoryService
} from '../core/services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit {

  inventory: InventoryLot[] = [];

  totalQuantity = 0;
  usableQuantity = 0;
  expiredQuantity = 0;
  lotCount = 0;

  loading = false;
  errorMessage = '';

  constructor(
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.errorMessage = '';

    this.inventoryService.getInventory().subscribe({
      next: response => {
        this.inventory = response.results ?? response;

        /*
         * FIFO ordering:
         * InventoryLot backend ordering is:
         * received_at ASC, id ASC
         *
         * We also sort here so the UI explicitly presents
         * oldest received stock first.
         */
        this.inventory.sort((a, b) => {
          const dateA = new Date(a.received_at).getTime();
          const dateB = new Date(b.received_at).getTime();

          if (dateA !== dateB) {
            return dateA - dateB;
          }

          return a.id - b.id;
        });

        this.calculateSummary();

        this.loading = false;
      },

      error: error => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  calculateSummary(): void {
    this.totalQuantity = this.inventory.reduce(
      (total, lot) => total + Number(lot.quantity),
      0
    );

    this.usableQuantity = this.inventory.reduce(
      (total, lot) => total + Number(lot.usable_quantity),
      0
    );

    this.expiredQuantity = this.totalQuantity - this.usableQuantity;

    this.lotCount = this.inventory.length;
  }

  getUsableQuantity(lot: InventoryLot): number {
    return Number(lot.usable_quantity);
  }

  getQuantity(lot: InventoryLot): number {
    return Number(lot.quantity);
  }

  formatQuantity(quantity: number): string {
    return quantity.toFixed(3);
  }

  formatDate(date: string | null): string {
    if (!date) {
      return 'No expiry';
    }

    return new Date(date + 'T00:00:00').toLocaleDateString('en-IN');
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.detail) {
      return error.error.detail;
    }

    if (error?.error && typeof error.error === 'object') {
      return Object.entries(error.error)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');
    }

    return 'Unable to load inventory. Please try again.';
  }
}