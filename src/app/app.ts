import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProductService } from './services/product.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly produitService = inject(ProductService);

  protected readonly nombreProduits = this.produitService.nombreProduits;

  protected allerProduits(): void {
    this.router.navigate(['/produits']);
  }

  protected reinitialiser(): void {
    if (window.confirm('Restaurer le jeu de produits de démonstration ?')) {
      this.produitService.reinitialiser();
    }
  }
}