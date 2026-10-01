// SECTION 9 — « Création du Service produit »
// Service injectable (singleton) : il détient le tableau des produits et expose
// les opérations CRUD. Les composants nemanipulent jamais le tableau directement.
import { Injectable, computed, signal } from '@angular/core';
import { PRODUITS_INITIAUX, Produit, ProduitSaisi } from '../models/produit';

const CLE_STOCKAGE = 'atelier-produits.produits';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Signal privé : seul le service écrit dedans.
  private readonly produits = signal<Produit[]>(this.charger());

  // Signaux publics en lecture seule, consommés par les composants.
  readonly listeProduits = this.produits.asReadonly();
  readonly nombreProduits = computed(() => this.produits().length);
  readonly valeurDuStock = computed(() =>
    this.produits().reduce((total, p) => total + p.prix * p.quantite, 0),
  );

  getProduit(id: number): Produit | undefined {
    return this.produits().find((p) => p.id === id);
  }

  ajouter(produit: ProduitSaisi): Produit {
    const nouveau: Produit = {
      ...produit,
      id: this.produits().length > 0 ? Math.max(...this.produits().map((p) => p.id)) + 1 : 1,
      prix: Number(produit.prix),
      quantite: Number(produit.quantite),
    };
    this.produits.update((liste) => [...liste, nouveau]);
    this.persist();
    return nouveau;
  }

  modifier(id: number, changement: ProduitSaisi): boolean {
    let trouve = false;
    this.produits.update((liste) =>
      liste.map((p) => {
        if (p.id !== id) {
          return p;
        }
        trouve = true;
        return {
          ...p,
          ...changement,
          prix: Number(changement.prix),
          quantite: Number(changement.quantite),
        };
      }),
    );
    if (trouve) {
      this.persist();
    }
    return trouve;
  }

  supprimer(id: number): void {
    this.produits.update((liste) => liste.filter((p) => p.id !== id));
    this.persist();
  }

  reinitialiser(): void {
    this.produits.set([...PRODUITS_INITIAUX]);
    this.persist();
  }

  // Persistance : le tableau survit au rechargement de la page.
  private persist(): void {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(this.produits()));
    } catch {
      // stockage indisponible (navigation privée) : l'application reste fonctionnelle en mémoire
    }
  }

  private charger(): Produit[] {
    try {
      const brut = localStorage.getItem(CLE_STOCKAGE);
      if (!brut) {
        return [...PRODUITS_INITIAUX];
      }
      const parse = JSON.parse(brut) as Produit[];
      return Array.isArray(parse) && parse.length > 0 ? parse : [...PRODUITS_INITIAUX];
    } catch {
      return [...PRODUITS_INITIAUX];
    }
  }
}