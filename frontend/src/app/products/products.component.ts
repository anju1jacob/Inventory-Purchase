import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder,ReactiveFormsModule, Validators} from '@angular/forms';
import {Product, ProductService} from '../core/services/product.service';
import {Tax, TaxService} from '../core/services/tax.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {

  products: Product[] = [];
  taxes: Tax[] = [];

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  editingId: number | null = null;

  productForm!: ReturnType<FormBuilder['group']>;

constructor(
  private fb: FormBuilder,
  private productService: ProductService,
  private taxService: TaxService
) {
  this.productForm = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    category: ['', Validators.required],
    cost_price: [
      '0.00',
      [
        Validators.required,
        Validators.min(0)
      ]
    ],
    selling_price: [
      '0.00',
      [
        Validators.required,
        Validators.min(0)
      ]
    ],
    tax: [null as number | null],
    is_lot_controlled: [false],
    is_active: [true]
  });
}

  ngOnInit(): void {
    this.loadProducts();
    this.loadTaxes();
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: response => {
        this.products = response.results;
        this.loading = false;
      },
      error: error => {
        this.errorMessage = this.getErrorMessage(error);
        this.loading = false;
      }
    });
  }

  loadTaxes(): void {
  this.taxService.getTaxes().subscribe({
    next: response => {
      this.taxes = response.results;
    },
    error: error => {
      this.errorMessage = this.getErrorMessage(error);
    }
  });
}

  submit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const value = this.productForm.getRawValue();

    const product: Product = {
      code: value.code!,
      name: value.name!,
      category: value.category!,
      cost_price: value.cost_price!,
      selling_price: value.selling_price!,
      tax: value.tax,
      is_lot_controlled: value.is_lot_controlled ?? false,
      is_active: value.is_active ?? true
    };

    if (Number(product.selling_price) < Number(product.cost_price)) {
      this.errorMessage =
        'Selling price cannot be lower than cost price.';
      return;
    }

    this.saving = true;

    if (this.editingId) {

      this.productService
        .updateProduct(this.editingId, product)
        .subscribe({
          next: () => {
            this.successMessage = 'Product updated successfully.';
            this.resetForm();
            this.loadProducts();
            this.saving = false;
          },
          error: error => {
            this.errorMessage = this.getErrorMessage(error);
            this.saving = false;
          }
        });

    } else {

      this.productService
        .createProduct(product)
        .subscribe({
          next: () => {
            this.successMessage = 'Product created successfully.';
            this.resetForm();
            this.loadProducts();
            this.saving = false;
          },
          error: error => {
            this.errorMessage = this.getErrorMessage(error);
            this.saving = false;
          }
        });
    }
  }

  edit(product: Product): void {
    this.editingId = product.id!;

    this.productForm.patchValue({
      code: product.code,
      name: product.name,
      category: product.category,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      tax: product.tax,
      is_lot_controlled: product.is_lot_controlled,
      is_active: product.is_active
    });

    this.successMessage = '';
    this.errorMessage = '';
  }

  toggleActive(product: Product): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.productService
      .updateProduct(product.id!, {
        is_active: !product.is_active
      })
      .subscribe({
        next: () => {
          this.successMessage = product.is_active
            ? 'Product deactivated.'
            : 'Product activated.';

          this.loadProducts();
        },
        error: error => {
          this.errorMessage = this.getErrorMessage(error);
        }
      });
  }

  resetForm(): void {
    this.editingId = null;

    this.productForm.reset({
      code: '',
      name: '',
      category: '',
      cost_price: '0.00',
      selling_price: '0.00',
      tax: null,
      is_lot_controlled: false,
      is_active: true
    });
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

    return 'Something went wrong. Please try again.';
  }
}