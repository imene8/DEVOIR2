// SECTION 10 — « Transmettre des paramètres avec ActivatedRoute »
// L'id du produit à modifier est lu depuis l'URL, pas depuis un service.
// SECTION 10 — « Cacher le champ Id Produit ou le rendre Read Only »
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CATEGORIES_PRODUIT, Produit } from '../../models/produit';

@Component({
  selector: 'app-product-edit',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-edit.html',
  styleUrl: './product-edit.css',
})
export class ProductEdit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly produitService = inject(ProductService);

  protected readonly categories = CATEGORIES_PRODUIT;

  // Champ Id produit : masqué par défaut, affichable via la case à cocher.
  protected readonly afficherId = signal(false);

  protected readonly idProduit = signal<number | null>(null);
  protected readonly produitIntrouvable = signal(false);
  protected readonly formSubmitted = signal(false);
  protected readonly message = signal('');

  protected readonly produitForm = this.fb.nonNullable.group({
    id: [0],
    nom: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    prix: [0, [Validators.required, Validators.min(0.01)]],
    quantite: [1, [Validators.required, Validators.min(0)]],
    categorie: [this.categories[0], Validators.required],
  });

  protected readonly messagesErreur: Record<string, string> = {
    nom: 'Le nom est obligatoire (3 caractères minimum).',
    description: 'La description est obligatoire (5 caractères minimum).',
    prix: 'Le prix doit être un nombre supérieur à 0.',
    quantite: 'La quantité doit être un entier positif ou nul.',
    categorie: 'Choisissez une catégorie.',
  };

  constructor() {
    this.chargerProduit();
  }

  // ---- Chargement du produit à partir du paramètre d'URL ------------------
  private chargerProduit(): void {
    // « id » = nom du paramètre déclaré dans app.routes.ts
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id)) {
      this.produitIntrouvable.set(true);
      return;
    }

    const produit = this.produitService.getProduit(id);
    if (!produit) {
      this.produitIntrouvable.set(true);
      return;
    }

    this.idProduit.set(produit.id);
    this.remplirFormulaire(produit);
  }

  private remplirFormulaire(produit: Produit): void {
    this.produitForm.patchValue({
      id: produit.id,
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      quantite: produit.quantite,
      categorie: produit.categorie,
    });
    // Les contrôles patchés ne sont plus « touched » : on remet l'état à zéro.
    this.produitForm.markAsPristine();
  }

  // ---- Bascule d'affichage du champ Id ------------------------------------
  protected basculerAffichageId(): void {
    this.afficherId.update((v) => !v);
  }

  protected estInvalide(champ: string): boolean {
    const ctrl = this.produitForm.get(champ);
    return !!ctrl && ctrl.invalid && (ctrl.touched || this.formSubmitted());
  }

  protected afficherErreur(champ: string): string {
    const ctrl = this.produitForm.get(champ);
    if (!ctrl?.errors) {
      return '';
    }
    if (ctrl.errors['required'] || ctrl.errors['minlength'] || ctrl.errors['min']) {
      return this.messagesErreur[champ] ?? 'Valeur invalide.';
    }
    return 'Valeur invalide.';
  }

  protected modifierProduit(): void {
    this.formSubmitted.set(true);
    const id = this.idProduit();

    if (id === null) {
      this.message.set('Aucun produit à modifier.');
      return;
    }

    if (this.produitForm.invalid) {
      this.produitForm.markAllAsTouched();
      this.message.set('Le formulaire contient des erreurs. Corrigez les champs en rouge.');
      return;
    }

    const { id: _ignore, ...modifications } = this.produitForm.getRawValue();
    const ok = this.produitService.modifier(id, modifications);

    if (!ok) {
      this.produitIntrouvable.set(true);
      return;
    }

    // Retour à la liste avec un message de confirmation dans l'état de navigation
    this.router.navigate(['/produits'], {
      queryParams: { modifie: this.produitForm.getRawValue().nom },
    });
  }

  protected annuler(): void {
    this.router.navigate(['/produits']);
  }
}