import { Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout.component';
import { ProductsComponent } from './products/products.component';
import { TaxesComponent } from './taxes/taxes.component';
import { PurchasesComponent } from './purchases/purchases.component';
import { InventoryComponent } from './inventory/inventory.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'products',
        component: ProductsComponent
      },
      {
        path: 'taxes',
        component: TaxesComponent
      },
      {
        path: 'purchases',
        component: PurchasesComponent
      },
      {
        path: 'inventory',
        component: InventoryComponent
      }
    ]
  }
];