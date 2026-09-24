import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Tax,
  TaxService
} from '../core/services/tax.service';

@Component({
  selector: 'app-taxes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './taxes.component.html',
  styleUrl: './taxes.component.css'
})
export class TaxesComponent implements OnInit {

  taxes: Tax[] = [];

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  editingId: number | null = null;

  showComponentForm = false;
  selectedCompoundTaxId: number | null = null;

  taxForm!: ReturnType<FormBuilder['group']>;
  componentForm!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private taxService: TaxService
  ) {

    this.taxForm = this.fb.group({

      name: [
        '',
        Validators.required
      ],

      code: [
        '',
        Validators.required
      ],

      tax_type: [
        'SIMPLE' as 'SIMPLE' | 'COMPOUND',
        Validators.required
      ],

      rate: [
        '0.00',
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      is_active: [
        true
      ]

    });


    this.componentForm = this.fb.group({

      component_tax: [
        null as number | null,
        Validators.required
      ],

      sequence: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ]

    });
  }


  ngOnInit(): void {
    this.loadTaxes();
  }


  loadTaxes(): void {

    this.loading = true;
    this.errorMessage = '';

    this.taxService.getTaxes().subscribe({

      next: response => {

        this.taxes =
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


  /*
   * Returns only SIMPLE taxes.
   *
   * A compound tax cannot be used as a
   * component of another compound tax.
   */
  get availableComponentTaxes(): Tax[] {

    return this.taxes.filter(tax => {

      return (
        tax.tax_type === 'SIMPLE' &&
        tax.is_active &&
        tax.id !== this.selectedCompoundTaxId
      );

    });

  }


  /*
   * Find selected compound tax.
   */
  getSelectedTax(): Tax | undefined {

    if (!this.selectedCompoundTaxId) {
      return undefined;
    }

    return this.taxes.find(
      tax => tax.id === this.selectedCompoundTaxId
    );

  }


  /*
   * Get tax name using tax ID.
   */
  getTaxName(id: number | null): string {

    if (!id) {
      return '';
    }

    const tax = this.taxes.find(
      item => item.id === id
    );

    return tax?.name ?? '';
  }


  /*
   * Get component tax rate.
   */
  getComponentRate(id: number): string {

    const tax = this.taxes.find(
      item => item.id === id
    );

    return tax?.rate ?? '0.00';
  }


  submit(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (this.taxForm.invalid) {

      this.taxForm.markAllAsTouched();

      return;
    }


    const value =
      this.taxForm.getRawValue();


    const tax: Tax = {

      name: value.name!,

      code: value.code!,

      tax_type: value.tax_type!,

      rate:
        value.tax_type === 'COMPOUND'
          ? '0.00'
          : value.rate!,

      is_active:
        value.is_active ?? true

    };


    this.saving = true;


    if (this.editingId) {

      this.taxService
        .updateTax(
          this.editingId,
          tax
        )
        .subscribe({

          next: () => {

            this.successMessage =
              'Tax updated successfully.';

            this.resetForm();

            this.loadTaxes();

            this.saving = false;
          },

          error: error => {

            this.errorMessage =
              this.getErrorMessage(error);

            this.saving = false;
          }

        });

    } else {

      this.taxService
        .createTax(tax)
        .subscribe({

          next: () => {

            this.successMessage =
              'Tax created successfully.';

            this.resetForm();

            this.loadTaxes();

            this.saving = false;
          },

          error: error => {

            this.errorMessage =
              this.getErrorMessage(error);

            this.saving = false;
          }

        });

    }

  }


  edit(tax: Tax): void {

    this.editingId =
      tax.id!;


    this.taxForm.patchValue({

      name: tax.name,

      code: tax.code,

      tax_type: tax.tax_type,

      rate: tax.rate,

      is_active: tax.is_active

    });


    this.errorMessage = '';
    this.successMessage = '';
  }


  toggleActive(tax: Tax): void {

    this.errorMessage = '';
    this.successMessage = '';


    this.taxService
      .updateTax(
        tax.id!,
        {
          is_active: !tax.is_active
        }
      )
      .subscribe({

        next: () => {

          this.successMessage =
            tax.is_active
              ? 'Tax deactivated.'
              : 'Tax activated.';

          this.loadTaxes();
        },

        error: error => {

          this.errorMessage =
            this.getErrorMessage(error);

        }

      });

  }


  resetForm(): void {

    this.editingId = null;


    this.taxForm.reset({

      name: '',

      code: '',

      tax_type: 'SIMPLE',

      rate: '0.00',

      is_active: true

    });

  }


  /*
   * Open compound tax configuration.
   */
  openComponentForm(tax: Tax): void {

    if (tax.tax_type !== 'COMPOUND') {
      return;
    }


    this.selectedCompoundTaxId =
      tax.id!;


    this.showComponentForm = true;


    this.errorMessage = '';
    this.successMessage = '';


    this.componentForm.reset({

      component_tax: null,

      sequence:
        (tax.components?.length ?? 0) + 1

    });


    /*
     * Scroll to the component configuration
     * section so the user immediately sees it.
     */
    setTimeout(() => {

      const element =
        document.getElementById(
          'compoundTaxConfiguration'
        );

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    });

  }


  addComponent(): void {

    this.errorMessage = '';
    this.successMessage = '';


    if (
      !this.selectedCompoundTaxId ||
      this.componentForm.invalid
    ) {

      this.componentForm.markAllAsTouched();

      return;
    }


    const value =
      this.componentForm.getRawValue();


    /*
     * Prevent duplicate component taxes
     * inside the same compound tax.
     */
    const selectedTax =
      this.getSelectedTax();


    const alreadyExists =
      selectedTax?.components?.some(
        component =>
          component.component_tax ===
          value.component_tax
      );


    if (alreadyExists) {

      this.errorMessage =
        'This tax is already configured as a component.';

      return;
    }


    this.taxService
      .createComponent({

        compound_tax:
          this.selectedCompoundTaxId,

        component_tax:
          value.component_tax!,

        sequence:
          value.sequence!

      })
      .subscribe({

        next: () => {

          this.successMessage =
            'Tax component added successfully.';

          this.componentForm.reset({

            component_tax: null,

            sequence:
              (selectedTax?.components?.length ?? 0) + 2

          });

          /*
           * Reload taxes so the newly added
           * component appears immediately.
           */
          this.loadTaxes();

        },

        error: error => {

          this.errorMessage =
            this.getErrorMessage(error);

        }

      });

  }


  cancelComponentForm(): void {

    this.showComponentForm = false;

    this.selectedCompoundTaxId = null;

    this.componentForm.reset({

      component_tax: null,

      sequence: 1

    });

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


    return (
      'Something went wrong. Please try again.'
    );

  }

}