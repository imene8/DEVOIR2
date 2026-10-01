import { Routes } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { ProductAdd } from './components/product-add/product-add';
import { ProductEdit } from './components/product-edit/product-edit';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'produits' },
  { path: 'produits', component: ProductList, title: 'Liste des produits' },
  { path: 'produits/ajouter', component: ProductAdd, title: 'Ajouter un produit' },
  // ':id' = paramètre dynamique. La valeur est lue dans ProductEdit via ActivatedRoute.
  { path: 'produits/modifier/:id', component: ProductEdit, title: 'Modifier un produit' },
  { path: '**', redirectTo: 'produits' },
];