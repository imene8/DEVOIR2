# Devoir 02 — Angular : Ajout, Modification et Suppression des Produits

Application de gestion de produits réalisée en Angular, couvrant les **sections 9 et 10** de
l'atelier. Le code de ces deux sections est intégralement présent dans ce dépôt ; les sections
antérieures ne sont pas nécessaires pour le faire fonctionner.

**Auteur :** Nadhem BEL HADJ

## Démarrage

```bash
npm install
npm start
```

L'application est disponible sur `http://localhost:4200`.

| Route | Écran |
| --- | --- |
| `/produits` | Liste des produits, avec les liens *Modifier* et *Supprimer* |
| `/produits/ajouter` | Formulaire d'ajout |
| `/produits/modifier/:id` | Formulaire de modification, `:id` = identifiant du produit |

## Contenu du dépôt

```
src/app/
├── models/produit.ts                    Interface Produit + catégories + données initiales
├── services/product.service.ts          Signal + CRUD + persistance localStorage
├── components/
│   ├── product-list/                    Affichage (@for), suppression, navigation
│   ├── product-add/                     Formulaire d'ajout (Reactive Forms)
│   └── product-edit/                    Formulaire de modification, champ Id en lecture seule
├── app.routes.ts                        Table de routage (:id)
├── app.html                             Barre de navigation + <router-outlet>
└── app.ts / app.css

docs/
├── RAPPORT_DEVOIR_02.md                 Rapport (source unique)
├── Devoir_02_Nadhem_BEL_HADJ.docx       Livrable Word avec les captures
└── captures/                            Captures d'écran de l'application

tools/
├── captures.mjs                         Parcours CRUD automatisés + captures
├── associer-captures.mjs                Associe les captures aux figures du rapport
├── build-docx.mjs                       Génère le .docx à partir du rapport .md
└── verifier-docx.cjs                    Contrôle du .docx produit
```

## Correspondance avec les sections du devoir

| Section | Sujet | Fichiers |
| --- | --- | --- |
| 9.2 | Classe modèle `Produit` | `src/app/models/produit.ts` |
| 9.3 | Options de l'instruction `@for` | `src/app/components/product-list/product-list.html` |
| 9.4 | Formulaire d'ajout | `src/app/components/product-add/` |
| 9.5 | Service produit | `src/app/services/product.service.ts` |
| 9.6 | Interface VS Classe | `src/app/models/produit.ts` |
| 10.2 | Lien de suppression | `src/app/components/product-list/product-list.html` |
| 10.3 | Formulaire de modification | `src/app/components/product-edit/` |
| 10.4 | Paramètres avec `ActivatedRoute` | `src/app/app.routes.ts`, `product-edit.ts` |
| 10.5 | Navigation avec `Router` | `src/app/app.html`, `app.ts`, `product-add.ts`, `product-list.ts` |
| 10.6 | Champ Id masqué ou `readonly` | `src/app/components/product-edit/product-edit.html` |

## Points d'implémentation

- **`@for` avec `track produit.id`** : l'identifiant sert de clé de suivi, ce qui évite le
  décalage des lignes lors d'une suppression. Le tableau `docs/captures/` montre le
  comportement obtenu.
- **Signaux** : `ProductService` détient un `signal<Produit[]>` privé et n'expose que
  `asReadonly()` et des `computed()`. Aucun composant n'écrit dans le tableau.
- **Reactive Forms** : `[formGroup]` et `formControlName`. Le formulaire d'ajout ne déclare pas
  de contrôle `id` ; celui de modification en déclare un, retiré par déconstruction avant l'envoi.
- **`ActivatedRoute.snapshot.paramMap`** : lecture de `:id`, avec conversion `Number()` et
  contrôle `Number.isNaN()` avant tout accès au tableau.
- **`readonly` plutôt que `disabled`** : le contrôle reste copiable et soumis avec le
  formulaire, ce que `disabled` exclut.

## Régénérer le rapport Word

```bash
npm run rapport
```

Le script lit `docs/RAPPORT_DEVOIR_02.md` et produit `docs/Devoir_02_Nadhem_BEL_HADJ.docx`.
Les blocs `::figure <chemin>` embarquent une capture ; les blocs `::figure` sans chemin laissent
un encadré à compléter manuellement.

## Régénérer les captures

```bash
npm start            # dans un terminal
npm run captures     # dans un autre
```

Le script pilote l'application dans Edge, vérifie les parcours d'ajout, de modification et de
suppression, puis enregistre les captures dans `docs/captures/`. Il sort en code 1 si une
erreur console apparaît ou si un parcours échoue.