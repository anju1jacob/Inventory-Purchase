import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Product,
  ProductService
} from '../core/services/product.service';

import {
  Tax,
  TaxService
} from '../core/services/tax.service';

import {
  PurchaseLine,
  PurchaseService,
  PurchaseVoucher
} from '../core/services/purchase.service';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.css'
})
export class PurchasesComponent implements OnInit {

  products: Product[] = [];
  taxes: Tax[] = [];

  vouchers: PurchaseVoucher[] = [];

  loading = false;
  saving = false;
  posting = false;

  errorMessage = '';
  successMessage = '';

  currentVoucherId: number | null = null;

  purchaseForm!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private taxService: TaxService,
    private purchaseService: PurchaseService
  ) {

    this.purchaseForm = this.fb.group({

      voucher_number: [
        '',
        Validators.required
      ],

      supplier_name: [
        '',
        Validators.required
      ],

      invoice_number: [
        '',
        Validators.required
      ],

      invoice_date: [
        this.getToday(),
        Validators.required
      ],

      lines: this.fb.array([])

    });

  }


  ngOnInit(): void {

    this.loadProducts();
    this.loadTaxes();
    this.loadVouchers();

    this.addLine();

  }


  // ==========================================
  // FORM ARRAY
  // ==========================================

  get lines(): FormArray {

    return this.purchaseForm.get(
      'lines'
    ) as FormArray;

  }


  createLine(): ReturnType<FormBuilder['group']> {

    return this.fb.group({

      product: [
        null,
        Validators.required
      ],

      quantity: [
  1,
  [
    Validators.required,
    Validators.min(1),
    Validators.pattern(/^[1-9]\d*$/)
  ]
],

      unit_cost: [
        '0.00',
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      discount: [
        '0.00',
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      lot_number: [
        ''
      ],

      expiry_date: [
        ''
      ]

    });

  }


  addLine(): void {

    this.lines.push(
      this.createLine()
    );

  }


  removeLine(index: number): void {

    if (this.lines.length === 1) {

      this.errorMessage =
        'At least one purchase line is required.';

      return;

    }

    this.lines.removeAt(index);

    this.errorMessage = '';

  }


  // ==========================================
  // DATA LOADING
  // ==========================================

  loadProducts(): void {

    this.productService
      .getProducts()
      .subscribe({

        next: response => {

          this.products =
            response.results.filter(
              product => product.is_active
            );

        },

        error: error => {

          this.errorMessage =
            this.getErrorMessage(error);

        }

      });

  }


  loadTaxes(): void {

    this.taxService
      .getTaxes()
      .subscribe({

        next: response => {

          this.taxes =
            response.results ?? response;

        },

        error: error => {

          this.errorMessage =
            this.getErrorMessage(error);

        }

      });

  }


  loadVouchers(): void {

    this.loading = true;

    this.purchaseService
      .getVouchers()
      .subscribe({

        next: response => {

          this.vouchers =
            response.results ?? response;

          this.loading = false;

        },

        error: error => {

          this.errorMessage =
            this.getErrorMessage(error);

          this.loading = false;

        }

      });

  }


  // ==========================================
  // PRODUCT HANDLING
  // ==========================================

  getProduct(
    productId: number | null
  ): Product | undefined {

    if (!productId) {
      return undefined;
    }

    return this.products.find(
      product => product.id === productId
    );

  }


  isLotControlled(index: number): boolean {

    const productId =
      this.lines.at(index)
        .get('product')?.value;

    return !!this.getProduct(productId)?.is_lot_controlled;

  }


  onProductChange(index: number): void {

    const line =
      this.lines.at(index);

    const productId =
      line.get('product')?.value;

    const product =
      this.getProduct(productId);


    if (!product) {

      line.patchValue({

        unit_cost: '0.00',

        lot_number: '',

        expiry_date: ''

      });

      return;

    }


    /*
     * Default purchase cost to the
     * product's current cost price.
     */
    line.patchValue({

      unit_cost: product.cost_price,

      discount: '0.00',

      lot_number: '',

      expiry_date: ''

    });

  }


  // ==========================================
  // TAX CALCULATION
  // ==========================================

  getTaxRate(
    product: Product | undefined
  ): number {

    if (!product?.tax) {
      return 0;
    }


    const tax =
      this.taxes.find(
        item => item.id === product.tax
      );


    if (!tax) {
      return 0;
    }


    if (tax.tax_type === 'SIMPLE') {

      return Number(tax.rate);

    }


    /*
     * Compound tax:
     *
     * CGST 9% + SGST 9% = 18%
     *
     * Both components apply to the
     * same taxable amount.
     */
    return (
      tax.components?.reduce(
        (total, component) =>
          total +
          Number(
            this.getComponentRate(
              component.component_tax
            )
          ),
        0
      ) ?? 0
    );

  }


  getComponentRate(
    taxId: number
  ): string {

    const tax =
      this.taxes.find(
        item => item.id === taxId
      );

    return tax?.rate ?? '0.00';

  }


  getTaxName(
    product: Product | undefined
  ): string {

    if (!product?.tax) {
      return 'No Tax';
    }

    const tax =
      this.taxes.find(
        item => item.id === product.tax
      );

    return tax?.name ?? 'No Tax';

  }


  // ==========================================
  // LINE CALCULATIONS
  // ==========================================

  getLineSubtotal(index: number): number {

    const line =
      this.lines.at(index);

    const quantity =
      Number(
        line.get('quantity')?.value || 0
      );

    const unitCost =
      Number(
        line.get('unit_cost')?.value || 0
      );

    return quantity * unitCost;

  }


  getLineDiscount(index: number): number {

    return Number(
      this.lines.at(index)
        .get('discount')?.value || 0
    );

  }


  getLineTax(index: number): number {

    const lineSubtotal =
      this.getLineSubtotal(index);

    const discount =
      this.getLineDiscount(index);

    const taxableAmount =
      Math.max(
        0,
        lineSubtotal - discount
      );


    const product =
      this.getProduct(
        this.lines.at(index)
          .get('product')?.value
      );


    const taxRate =
      this.getTaxRate(product);


    return (
      taxableAmount *
      taxRate /
      100
    );

  }


  getLineTotal(index: number): number {

    return (
      this.getLineSubtotal(index) -
      this.getLineDiscount(index) +
      this.getLineTax(index)
    );

  }


  get subtotal(): number {

    return this.lines.controls.reduce(
      (total, _, index) =>
        total +
        this.getLineSubtotal(index),
      0
    );

  }


  get discountTotal(): number {

    return this.lines.controls.reduce(
      (total, _, index) =>
        total +
        this.getLineDiscount(index),
      0
    );

  }


  get taxTotal(): number {

    return this.lines.controls.reduce(
      (total, _, index) =>
        total +
        this.getLineTax(index),
      0
    );

  }


  get netTotal(): number {

    return (
      this.subtotal -
      this.discountTotal +
      this.taxTotal
    );

  }


  // ==========================================
  // VALIDATION
  // ==========================================

  validateVoucher(): string | null {

    if (this.purchaseForm.invalid) {

      this.purchaseForm.markAllAsTouched();

      return 'Please complete all required voucher fields.';

    }


    if (this.lines.length === 0) {

      return 'At least one purchase line is required.';

    }


    const invoiceDate =
      this.purchaseForm.get(
        'invoice_date'
      )?.value;


    const seen =
      new Set<string>();


    for (
      let index = 0;
      index < this.lines.length;
      index++
    ) {

      const line =
        this.lines.at(index);


      const productId =
        line.get('product')?.value;


      const product =
        this.getProduct(productId);


      if (!product) {

        return `Please select a product for line ${index + 1}.`;

      }


      const quantity =
        Number(
          line.get('quantity')?.value
        );


      const unitCost =
        Number(
          line.get('unit_cost')?.value
        );


      const discount =
        Number(
          line.get('discount')?.value
        );


      if (quantity <= 0) {

        return `Quantity must be greater than zero for '${product.name}'.`;

      }


      if (unitCost < 0) {

        return `Unit cost cannot be negative for '${product.name}'.`;

      }


      const grossAmount =
        quantity * unitCost;


      if (discount < 0) {

        return `Discount cannot be negative for '${product.name}'.`;

      }


      if (discount > grossAmount) {

        return `Discount cannot exceed gross amount for '${product.name}'.`;

      }


      const lotNumber =
        line.get('lot_number')?.value;

      const expiryDate =
        line.get('expiry_date')?.value;


      let key: string;


      if (product.is_lot_controlled) {

        if (!lotNumber) {

          return `Lot number is required for '${product.name}'.`;

        }


        if (!expiryDate) {

          return `Expiry date is required for '${product.name}'.`;

        }


        if (
          invoiceDate &&
          expiryDate < invoiceDate
        ) {

          return `Expiry date for '${product.name}' cannot be before the invoice date.`;

        }


        if (
          expiryDate <
          this.getToday()
        ) {

          return `Lot '${lotNumber}' for '${product.name}' is already expired.`;

        }


        key =
          `${product.id}-${lotNumber}`;

      } else {

        if (lotNumber || expiryDate) {

          return `Lot information should not be provided for non-lot-controlled product '${product.name}'.`;

        }


        key =
          `${product.id}-NO-LOT`;

      }


      if (seen.has(key)) {

        return `The same product/lot cannot appear more than once in this voucher.`;

      }


      seen.add(key);

    }


    return null;

  }


  // ==========================================
  // SAVE DRAFT
  // ==========================================

  saveDraft(): void {

    this.errorMessage = '';
    this.successMessage = '';


    const validationError =
      this.validateVoucher();


    if (validationError) {

      this.errorMessage =
        validationError;

      return;

    }


    this.saving = true;


    const payload =
      this.buildPayload();


    if (this.currentVoucherId) {

      this.purchaseService
        .updateVoucher(
          this.currentVoucherId,
          payload
        )
        .subscribe({

          next: voucher => {

            this.saving = false;

            this.currentVoucherId =
              voucher.id!;

            this.successMessage =
              'Purchase voucher draft updated successfully.';

            this.loadVouchers();

          },

          error: error => {

            this.saving = false;

            this.errorMessage =
              this.getErrorMessage(error);

          }

        });

      return;

    }


    this.purchaseService
      .createVoucher(payload)
      .subscribe({

        next: voucher => {

          this.saving = false;

          this.currentVoucherId =
            voucher.id!;

          this.successMessage =
            'Purchase voucher saved as draft.';

          this.loadVouchers();

        },

        error: error => {

          this.saving = false;

          this.errorMessage =
            this.getErrorMessage(error);

        }

      });

  }


  // ==========================================
  // POST VOUCHER
  // ==========================================

 postVoucher(): void {

  this.errorMessage = '';
  this.successMessage = '';

  const validationError =
    this.validateVoucher();

  if (validationError) {

    this.errorMessage = validationError;

    return;
  }

  /*
   * First save the current form as a draft.
   * Then post the saved voucher.
   */
  this.saving = true;

  const payload =
    this.buildPayload();

  const saveRequest =
    this.currentVoucherId
      ? this.purchaseService.updateVoucher(
          this.currentVoucherId,
          payload
        )
      : this.purchaseService.createVoucher(
          payload
        );

  saveRequest.subscribe({

    next: voucher => {

      this.currentVoucherId =
        voucher.id!;

      this.saving = false;
      this.posting = true;

      this.purchaseService
        .postVoucher(voucher.id!)
        .subscribe({

          next: postedVoucher => {

            this.posting = false;

            /*
             * Keep the success message visible.
             */
            this.successMessage =
              `Voucher ${postedVoucher.voucher_number} posted successfully. Inventory has been updated.`;

            /*
             * Refresh voucher history first.
             */
            this.loadVouchers();

            /*
             * Clear the form for the next voucher.
             *
             * We do this AFTER successful posting,
             * so a failed posting never loses the
             * user's entered data.
             */
            this.clearVoucherForm();

          },

          error: error => {

            this.posting = false;

            this.errorMessage =
              this.getErrorMessage(error);

          }

        });

    },

    error: error => {

      this.saving = false;

      this.errorMessage =
        this.getErrorMessage(error);

    }

  });

}


  // ==========================================
  // BUILD API PAYLOAD
  // ==========================================

  buildPayload(): PurchaseVoucher {

    const value =
      this.purchaseForm.getRawValue();


    const lines: PurchaseLine[] =
      this.lines.controls.map(line => {

        return {

          product:
            Number(
              line.get('product')?.value
            ),

          quantity:
            String(
              line.get('quantity')?.value
            ),

          unit_cost:
            String(
              line.get('unit_cost')?.value
            ),

          discount:
            String(
              line.get('discount')?.value || '0'
            ),

          lot_number:
            line.get('lot_number')?.value || null,

          expiry_date:
            line.get('expiry_date')?.value || null

        };

      });


    return {

      voucher_number:
        value.voucher_number!,

      supplier_name:
        value.supplier_name!,

      invoice_number:
        value.invoice_number!,

      invoice_date:
        value.invoice_date!,

      lines

    };

  }


  // ==========================================
  // RESET
  // ==========================================

 newVoucher(): void {

  this.errorMessage = '';
  this.successMessage = '';

  this.clearVoucherForm();

}

  clearVoucherForm(): void {

  this.currentVoucherId = null;

  this.purchaseForm.reset({

    voucher_number: '',
    supplier_name: '',
    invoice_number: '',
    invoice_date: this.getToday()

  });

  while (this.lines.length) {

    this.lines.removeAt(0);

  }

  this.addLine();

}

  // ==========================================
  // HELPERS
  // ==========================================

  formatAmount(
    amount: number
  ): string {

    return amount.toFixed(2);

  }


  getToday(): string {

    const date =
      new Date();

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }


  private getErrorMessage(
    error: any
  ): string {

    if (error?.error?.detail) {

      return error.error.detail;

    }


    if (
      error?.error &&
      typeof error.error === 'object'
    ) {

      return Object.entries(error.error)
        .map(
          ([key, value]) =>
            `${key}: ${value}`
        )
        .join(' | ');

    }


    return 'Something went wrong. Please try again.';

  }

}