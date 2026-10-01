// SECTION 9 — « Création de la classe Modèle Produit »
// Interface TypeScript qui décrit la forme d'un produit (le modèle).
export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  quantite: number;
  categorie: string;
}

// Un produit « nouveau » = un produit sans identifiant : c'est le service qui l'attribue.
export type ProduitSaisi = Omit<Produit, 'id'>;

export const CATEGORIES_PRODUIT: readonly string[] = [
  'Alimentaire',
  'Boissons',
  'Hygiène',
  'Électronique',
  'Vêtements',
];

export const PRODUITS_INITIAUX: readonly Produit[] = [
  {
    id: 1,
    nom: 'Huile d’olive',
    description: 'Huile extra vierge, bouteille de 1 L.',
    prix: 45.5,
    quantite: 120,
    categorie: 'Alimentaire',
  },
  {
    id: 2,
    nom: 'Café moulu',
    description: 'Café arabica 250 g, torréfaction moyenne.',
    prix: 18.9,
    quantite: 80,
    categorie: 'Alimentaire',
  },
  {
    id: 3,
    nom: 'Eau minérale',
    description: 'Pack de 6 bouteilles de 1,5 L.',
    prix: 6.75,
    quantite: 300,
    categorie: 'Boissons',
  },
  {
    id: 4,
    nom: 'Savon de Marseille',
    description: 'Savon 300 g à l’huile d’olive.',
    prix: 4.2,
    quantite: 210,
    categorie: 'Hygiène',
  },
];