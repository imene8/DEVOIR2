// SECTION 9 (affichage de la liste avec l'instruction @for)
// SECTION 10 (lien de suppression, navigation avec Router / ActivatedRoute)
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  // Injection du service par la fonction inject() (idiome Angular moderne).
  protected readonly produitService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);

  protected readonly produits = this.produitService.listeProduits;
  protected readonly nombreProduits = this.produitService.nombreProduits;
  protected readonly valeurDuStock = this.produitService.valeurDuStock;

  // Message de confirmation transmis par la page de modification (?modifie=Nom)
  protected readonly nomModifie = signal<string | null>(
    this.route.snapshot.queryParamMap.get('modifie'),
  );

  protected readonly prixEnDinars = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
  });

  protected fermerMessage(): void {
    this.nomModifie.set(null);
  }

  // SECTION 10 — « Ajouter un lien pour supprimer un produit »
  protected supprimer(id: number, nom: string): void {
    if (window.confirm(`Supprimer le produit « ${nom} » ?`)) {
      this.produitService.supprimer(id);
    }
  }
}