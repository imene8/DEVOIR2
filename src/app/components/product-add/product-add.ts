// SECTION 9 — « Création d'un formulaire pour ajouter un nouveau produit »
// Formulaire réactif : FormGroup + FormControl liés par [formGroup] / formControlName.
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CATEGORIES_PRODUIT } from '../../models/produit';

@Component({
  selector: 'app-product-add',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-add.html',
  styleUrl: './product-add.css',
})
export class ProductAdd {
  private readonly fb = inject(FormBuilder);
  private readonly produitService = inject(ProductService);
  private readonly router = inject(Router);

  protected readonly categories = CATEGORIES_PRODUIT;
  protected readonly formSubmitted = signal(false);
  protected readonly message = signal('');
  protected readonly erreurGlobale = signal(false);

  // Déclaration du groupe de contrôles : c'est le « modèle » du formulaire.
  protected readonly produitForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    prix: [0, [Validators.required, Validators.min(0.01)]],
    quantite: [1, [Validators.required, Validators.min(0)]],
    categorie: [this.categories[0], Validators.required],
  });

  // Messages d'erreur affichés sous chaque champ.
  protected readonly messagesErreur: Record<string, string> = {
    nom: 'Le nom est obligatoire (3 caractères minimum).',
    description: 'La description est obligatoire (5 caractères minimum).',
    prix: 'Le prix doit être un nombre supérieur à 0.',
    quantite: 'La quantité doit être un entier positif ou nul.',
    categorie: 'Choisissez une catégorie.',
  };

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

  protected ajouterProduit(): void {
    this.formSubmitted.set(true);

    if (this.produitForm.invalid) {
      this.produitForm.markAllAsTouched();
      this.erreurGlobale.set(true);
      this.message.set('Le formulaire contient des erreurs. Corrigez les champs en rouge.');
      return;
    }

    this.erreurGlobale.set(false);
    const nouveau = this.produitService.ajouter(this.produitForm.getRawValue());
    this.message.set(`Produit « ${nouveau.nom} » ajouté avec l'identifiant ${nouveau.id}.`);

    this.produitForm.reset({
      nom: '',
      description: '',
      prix: 0,
      quantite: 1,
      categorie: this.categories[0],
    });
    this.formSubmitted.set(false);

    // SECTION 10 — « Naviguer entre les pages avec Router »
    this.router.navigate(['/produits']);
  }

  protected annuler(): void {
    this.router.navigate(['/produits']);
  }
}