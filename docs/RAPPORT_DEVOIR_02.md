# Devoir 02 — Angular : Formulaire d'ajout, Modification et Suppression des Produits

**Module :** Programmation Web Avancée / Ateliers Angular
**Étudiant :** Nadhem BEL HADJ
**Date :** 23 septembre (modifié le 25 septembre 2025)
**Détail :** 100 points — Sections 9 et 10

::toc

## Introduction

Ce rapport présente le rendu des **sections 9** et **10** de l'atelier Angular. L'objectif est de
construire une application de gestion de produits (CRUD) dans laquelle les données ne sont plus
écrites en dur dans le template : elles sont décrites par un **modèle**, stockées dans un
**service** et manipulées à travers des **formulaires**.

La section 9 pose les fondations (modèle, service, formulaire d'ajout). La section 10 ajoute les
opérations de modification et de suppression, ainsi que la navigation entre les pages avec le
routeur d'Angular.

### Environnement de travail

| Élément | Valeur |
| --- | --- |
| Framework | Angular 22 |
| Langage | TypeScript 6 |
| Styles | CSS |
| Gestion de formulaires | Reactive Forms (@angular/forms) |
| Navigation | @angular/router (Router, ActivatedRoute) |
| Éditeur | Visual Studio Code |
| Node.js | v24.15.0 |

::figure
**Figure 0.1** — Arborescence du projet `atelier-produits` dans Visual Studio Code.
Capturer l'arborescence `src/app` (models, services, components) et l'onglet `TERMINAL`.

### L'arborescence du projet

```
atelier-produits/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── product-list/      # Affichage + suppression (section 10)
│   │   │   │   ├── product-list.ts
│   │   │   │   ├── product-list.html
│   │   │   │   └── product-list.css
│   │   │   ├── product-add/       # Formulaire d'ajout (section 9)
│   │   │   │   ├── product-add.ts
│   │   │   │   ├── product-add.html
│   │   │   │   └── product-add.css
│   │   │   └── product-edit/       # Formulaire de modification (section 10)
│   │   │       ├── product-edit.ts
│   │   │       ├── product-edit.html
│   │   │       └── product-edit.css
│   │   ├── models/
│   │   │   └── produit.ts          # Classe / interface modèle Produit
│   │   ├── services/
│   │   │   └── product.service.ts  # Service produit (CRUD + persistance)
│   │   ├── app.routes.ts           # Table de routage
│   │   ├── app.ts
│   │   └── app.html
│   ├── styles.css
│   └── index.html
└── package.json
```

::figure captures/fig-00-2-liste-des-produits.png

**Figure 0.2** — Page d'accueil de l'application (liste des produits) au lancement.
La barre de navigation, le tableau des produits et le bouton « + Ajouter un produit » doivent
être visibles.

---

# Section 9 — Angular : Création de formulaire d'ajout des produits

## 9.1 Présentation de l'atelier

L'atelier de la section 9 (vidéo à **01:03**) introduit les trois briques nécessaires pour passer
d'une page statique à une page pilotée par des données :

1. le **modèle** (`Produit`) qui décrit la forme d'un produit ;
2. le **service** (`ProductService`) qui détient la collection et les opérations ;
3. le **composant** qui affiche la liste et qui propose le formulaire d'ajout.

L'objectif affiché à la fin de la section est le suivant : depuis la page liste, l'utilisateur
clique sur « Ajouter un produit », remplit un formulaire, valide, et le produit apparaît
immédiatement dans le tableau sans rechargement de la page.

### Pourquoi séparer le modèle, le service et le composant ?

Cette séparation repose sur le **pattern MVC**, que l'atelier présente explicitement dans la
partie « Interface VS Classe » (vidéo à **26:41**).

- Le **modèle** décrit *ce qu'est* un produit (des données).
- La **vue** décrit *comment* il est affiché (HTML, CSS).
- Le **contrôleur** (le service, ici) décrit *ce qui se passe* quand l'utilisateur agit.

Sans cette séparation, toute la logique se retrouverait dans le composant : la liste, la
validation et le stockage donneraient un fichier de plusieurs centaines de lignes impossible à
maintenir.

::figure
**Figure 9.1** — Schéma de l'atelier : Modèle ↔ Service ↔ Composants.
Un schéma simple en trois blocs suffit.

## 9.2 Création de la classe Modèle Produit

*(Vidéo à 03:02)*

On commence par définir la structure d'un produit. En TypeScript, cette structure s'écrit avec
une **interface**. Le mot `interface` décrit un contrat : il dit quelles propriétés doivent
exister et de quel type elles sont, sans contenir lui-même de logique ni de valeur.

Le fichier de modèle est `src/app/models/produit.ts`.

```ts
// SECTION 9 — « Création de la classe Modèle Produit »
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
```

### Lecture du modèle

- Chaque propriété est déclarée `nom: type;`. Le `;` final est obligatoire en TypeScript.
- `id` est un `number` et non un `string` : on pourra calculer, trier et comparer des
  identifiants.
- `ProduitSaisi` utilise l'utilitaire de type `Omit<Produit, 'id'>`. Il crée un nouveau type qui
  reprend toutes les propriétés de `Produit` **sauf** `id`. C'est exactement la forme que
  renvoie le formulaire d'ajout : l'utilisateur ne saisit pas l'identifiant, le service
  l'attribue.

### Les catégories et les données initiales

Le même fichier déclare la liste fermée des catégories et un jeu de produits de démonstration,
qui sert de contenu tant que la persistance `localStorage` est vide.

```ts
export const CATEGORIES_PRODUIT: readonly string[] = [
  'Alimentaire',
  'Boissons',
  'Hygiène',
  'Électronique',
  'Vêtements',
];

export const PRODUITS_INITIAUX: readonly Produit[] = [
  { id: 1, nom: 'Huile d’olive', description: 'Huile extra vierge, bouteille de 1 L.',
    prix: 45.5, quantite: 120, categorie: 'Alimentaire' },
  { id: 2, nom: 'Café moulu', description: 'Café arabica 250 g, torréfaction moyenne.',
    prix: 18.9, quantite: 80, categorie: 'Alimentaire' },
  { id: 3, nom: 'Eau minérale', description: 'Pack de 6 bouteilles de 1,5 L.',
    prix: 6.75, quantite: 300, categorie: 'Boissons' },
  { id: 4, nom: 'Savon de Marseille', description: 'Savon 300 g à l’huile d’olive.',
    prix: 4.2, quantite: 210, categorie: 'Hygiène' },
];
```

Le mot-clé `readonly` sur un tableau empêche d'ajouter ou de retirer un élément directement.
Pour obtenir une copie modifiable, on utilise `[...PRODUITS_INITIAUX]`. Cette précaution évite
qu'un service modifie par mégarde le jeu de données de référence.

::figure
**Figure 9.2** — Création du fichier `produit.ts` dans VS Code et déclaration de l'interface.
Capturer le panneau Explorateur (dossier `models`) avec le fichier `produit.ts` ouvert.

## 9.3 Options de l'instruction `@for`

*(Vidéo à 11:03)*

L'affichage de la liste ne se fait plus avec l'ancienne directive structurelle `*ngFor`, mais
avec l'**instruction de bloc `@for`**, introduite à partir d'Angular 17.

```html
@for (produit of produits(); track produit.id) {
  <tr>
    <td>{{ produit.id }}</td>
    <td>{{ produit.nom }}</td>
  </tr>
} @empty {
  <tr><td colspan="2">Aucun produit enregistré pour le moment.</td></tr>
}
```

### Les trois parties de `@for`

- `@for (` : le début du bloc. La syntaxe est `@for (variable of collection; options)`.
- `produit of produits()` : la variable locale, et la collection source. Les parenthèses
  indiquent que `produits()` est une **fonction** — c'est un signal, il faut donc l'appeler.
- `) {` : l'ouverture du bloc, dont le contenu est répété pour chaque élément.

### Les options

#### `track` — l'option obligatoire

`track` indique à Angular **comment identifier** un élément entre deux rendus. Sans `track`,
Angular ne peut pas savoir si la ligne affichée est nouvelle ou modifiée : il reconstruit tout
le DOM du tableau.

- `track produit.id` : le produit est identifié par son identifiant. C'est le bon choix ici,
  puisque l'`id` ne change jamais et reste unique.
- `track $index` : l'élément est identifié par sa **position** dans le tableau. Ce choix est
  correct uniquement si l'ordre ne change jamais et si rien n'est inséré ou retiré.

Dans notre application, les deux options « àngere le comportement du tableau :

| Option | Identifiant utilisé | Comportement |
| --- | --- | --- |
| `track produit.id` | L'identifiant du produit | Une modification ne reconstruit que la ligne concernée. Une suppression ne décale pas les autres lignes. |
| `track $index` | La position (0, 1, 2…) | Une suppression décale toutes les positions : Angular réutilise le DOM existant et met à jour le contenu des lignes. |

C'est précisément ce que l'atelier demande d'observer : avec `track $index`, supprimer la
première ligne du tableau provoque un décalage visible des données, alors qu'avec
`track produit.id` le tableau reste cohérent.

#### `@empty` — le bloc alternatif

`@empty` s'exécute quand la collection est vide. Il évite d'afficher un tableau sans ligne, ce
qui est le cas juste après la suppression du dernier produit.

#### Les variables disponibles dans le bloc

Dans le corps du `@for`, Angular met à disposition :

- la variable déclarée (`produit`) ;
- `$index`, `$first`, `$last`, `$even`, `$odd`, `$count` ;
- `$any` pour contourner le typage strict lorsqu'un attribut DOM attend une chaîne.

::figure
**Figure 9.3** — Test de `track $index` puis de `track produit.id`.
Deux captures : (a) suppression d'une ligne avec `track $index`, (b) suppression d'une ligne
avec `track produit.id`.

## 9.4 Création d'un formulaire pour ajouter un nouveau produit

*(Vidéo à 12:34)*

Le formulaire est construit avec les **Reactive Forms**, c'est-à-dire un objet `FormGroup`
déclaré dans la classe TypeScript et relié au template par la directive `[formGroup]`.

La différence essentielle avec les *Template Driven Forms* (`[(ngModel)]`) est le sens du flux :
dans les reactive forms, le modèle est déclaré dans TypeScript et le template ne fait que s'y
attacher.

### La déclaration du formulaire

```ts
protected readonly produitForm = this.fb.nonNullable.group({
  nom: ['', [Validators.required, Validators.minLength(3)]],
  description: ['', [Validators.required, Validators.minLength(5)]],
  prix: [0, [Validators.required, Validators.min(0.01)]],
  quantite: [1, [Validators.required, Validators.min(0)]],
  categorie: [this.categories[0], Validators.required],
});
```

- `this.fb` est l'objet `FormBuilder` injecté : il fabrique le `FormGroup` sans avoir à écrire
  `new FormControl(...)` pour chaque champ.
- `.nonNullable.group({...})` crée un formulaire dont les valeurs ne sont **jamais** `null` ni
  `undefined`. On obtient ainsi `prix: number` au lieu de `number | null`, ce qui supprime les
  vérifications de nullité dans le service.
- Chaque entrée du tableau est le couple `[valeurInitiale, validateurs]`.

### Les validateurs

| Validateur | Rôle |
| --- | --- |
| `Validators.required` | Le champ ne peut pas être vide. |
| `Validators.minLength(n)` | Le texte doit contenir au moins `n` caractères. |
| `Validators.min(n)` | La valeur numérique doit être supérieure ou égale à `n`. |

### Le template du formulaire

```html
<form [formGroup]="produitForm" (ngSubmit)="ajouterProduit()" class="form-produit">
  <div class="champ">
    <label for="nom">Nom du produit <span class="obligatoire">*</span></label>
    <input type="text" id="nom" formControlName="nom"
           [class.invalide]="estInvalide('nom')" placeholder="Ex. : Huile d'olive" />
    @if (estInvalide('nom')) {
      <small class="erreur">{{ afficherErreur('nom') }}</small>
    }
  </div>
  ...
</form>
```

Trois directives sont en jeu :

- `[formGroup]="produitForm"` : lie l'élément `<form>` au groupe déclaré en TypeScript.
- `formControlName="nom"` : lie un contrôle du groupe à un champ HTML. Le nom doit être
  **identique** à la clé déclarée dans le `group({...})`.
- `(ngSubmit)="ajouterProduit()"` : intercepte la soumission et empêche le rechargement de la
  page, ce que le `submit` natif ferait.

### L'affichage des erreurs

```ts
protected estInvalide(champ: string): boolean {
  const ctrl = this.produitForm.get(champ);
  return !!ctrl && ctrl.invalid && (ctrl.touched || this.formSubmitted());
}
```

Un contrôle est invalide mais pas encore touché tant que l'utilisateur n'est pas resté dans le
champ. On ne veut pas afficher une erreur sous un champ vide que l'utilisateur n'a pas encore
visité : d'où la double condition `touched || formSubmitted()`.

`afficherErreur()` translates ensuite la clé d'erreur renvoyée par Angular
(`required`, `minlength`, `min`) en un message lisible.

::figure captures/fig-9-4-formulaire-ajout-vide.png

**Figure 9.4** — Page « Ajouter un produit » avec le formulaire vide.
Le champ `description` est déjà rempli pour illustrer le textarea.

::figure captures/fig-9-5-formulaire-erreurs.png

**Figure 9.5** — Soumission d'un formulaire incomplet : les champs obligatoires sont
surlignés en rouge et les messages d'erreur apparaissent.

## 9.5 Création du Service produit

*(Vidéo à 12:34)*

Le service est le point d_truth des données : tous les composants lisent et écrivent par lui.

```ts
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly produits = signal<Produit[]>(this.charger());

  readonly listeProduits = this.produits.asReadonly();
  readonly nombreProduits = computed(() => this.produits().length);
}
```

### L'injection

`@Injectable({ providedIn: 'root' })` déclare la classe comme injectable et demande à Angular
d'en créer **une seule instance** pour toute l'application (pattern *singleton*). C'est cette
annotation qui permet ensuite l'injection par le jeton de la classe.

Les composants récupèrent l'instance avec la fonction `inject()` :

```ts
protected readonly produitService = inject(ProductService);
```

C'est l'équivalent moderne de l'injection par constructeur ; elle se déclare dans un champ, et
le service est disponible dès l'initialisation de la propriété.

### Les signals

Un **signal** est une variable qui signale à Angular ses changements : toute lecture dans un
template devient automatiquement réactive, sans `subscribe` ni `ngModel`.

| Élément | Rôle |
| --- | --- |
| `signal<Produit[]>(...)` | Crée un signal modifiable : c'est la source de vérité. |
| `private readonly` | Interdit l'écriture depuis l'extérieur du service. |
| `.asReadonly()` | Expose une version en lecture seule aux composants. |
| `computed(() => ...)` | Crée une valeur dérivée, recalculée à chaque changement de la source. |

`listeProduits` et `valeurDuStock` sont donc toujours à jour : il n'y a pas de propriété
« nombre de produits » à mettre à jour manuellement après un ajout.

### Les opérations CRUD

```ts
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

supprimer(id: number): void {
  this.produits.update((liste) => liste.filter((p) => p.id !== id));
  this.persist();
}
```

Points à noter :

- `.update((liste) => [...liste, nouveau])` : on renvoie un **nouveau** tableau. Les signals
  comparent les références : muter le tableau existant ne déclencherait aucune mise à jour.
- `Math.max(...ids) + 1` : l'identifiant est calculé à partir du plus grand identifiant existant,
  ce qui reste correct même après plusieurs suppressions.
- `.filter((p) => p.id !== id)` : renvoie un nouveau tableau ne contenant que les produits
  différents du produit ciblé.

### La persistance

`persist()` et `charger()` sérialisent le tableau dans `localStorage`. La méthode `charger()` est
appelée **au moment de la construction** du service (`signal<Produit[]>(this.charger())`), ce qui
signifie que la collection initiale est déjà restaurée au premier accès au service.

::figure
**Figure 9.6** — `ProductService` dans VS Code, avec les méthodes `ajouter`, `modifier`,
`supprimer`, `reinitialiser`.

## 9.6 Interface VS Classe

*(Vidéo à 26:41)*

Cette partie compare les deux façons de décrire un produit et justifie le choix de l'interface.

| | `interface Produit` | `class Produit` |
| --- | --- | --- |
| Contenu | Des types uniquement | Des types, des propriétés, des méthodes |
| Initialisation | Aucune obligation | Constructeur obligatoire pour l'état |
| Usage | Décrire la forme d'un objet | Créer des objets avec un comportement |
| Héritage | Non | Possible (`extends`) |
| Implémentation | Non | Oui (`implements`) |
| Mot-clé d'instance | `{ id: 1, nom: 'Café' }` | `new Produit(...)` |

**Pourquoi une interface ici ?** Un produit est une simple donnée. Il n'a ni comportement ni
état interne à protéger. Une interface exprime exactement cela, en moins de code, et laisse la
possibilité de revenir à une classe si le modèle gagne des méthodes de calcul (par exemple une
property `valeurTotale`).

Une précision utile : en TypeScript, une `interface` et un `type` OBJECT sont presque
identiques — les deux sont purement structurels. La différence pratique tient surtout au fait
qu'une interface peut être **étendue** (`extends`) et peut servir de contrat pour une classe
(`implements`), ce que `type` ne peut pas faire.

::figure
**Figure 9.7** — Comparaison dans VS Code : déclaration `interface` puis déclaration `class`
équivalente, côte à côte.

## 9.7 Récapitulatif de la section 9

| Étape | Fichier produit | Résultat |
| --- | --- | --- |
| Modèle | `src/app/models/produit.ts` | L'interface `Produit` décrit un produit. |
| Affichage | `product-list.html` | `@for` affiche le tableau, `@empty` gère le cas vide. |
| Formulaire | `product-add.ts` / `.html` | Un `FormGroup` validé, relié par `[formGroup]`. |
| Service | `src/app/services/product.service.ts` | Signal + CRUD + persistance `localStorage`. |

::figure captures/fig-9-8-apres-ajout.png

**Figure 9.8** — Produit « Lattes » ajouté depuis le formulaire : il apparaît dans le tableau,
le compteur passe à 5 et la valeur du stock est recalculée.

---

# Section 10 — Angular : Modification et Suppression des produits

## 10.1 Présentation de l'atelier

*(Vidéo à 03:14)*

La section 10 étend l'application de la section 9. Les ajouts sont traités par l'identifiant du
produit, et le passage de l'identifiant d'une page à l'autre se fait par l'URL — jamais par une
variable globale partagée.

Le plan de la section :

1. ajouter un lien de suppression dans le tableau ;
2. créer un formulaire de modification, sur le modèle de celui de la section 9 ;
3. transmettre l'identifiant du produit à modifier par l'URL (`ActivatedRoute`) ;
4. naviguer entre les pages avec le `Router` ;
5. gérer le champ « Id Produit », qui ne doit jamais être modifiable.

## 10.2 Ajouter un lien pour supprimer un produit

*(Vidéo à 01:42)*

La suppression se déclenche depuis la liste, par un lien placé dans la colonne « Actions ».

```html
<a class="lien-action"
   [routerLink]="['/produits/modifier', produit.id]">Modifier</a>

<a class="lien-action lien-supprimer" href="#"
   (click)="supprimer(produit.id, produit.nom); $event.preventDefault()">
  Supprimer
</a>
```

Deux liens, deux mécaniques différentes :

- **Modifier** est une navigation : c'est un `routerLink`. Angular construit l'URL
  `/produits/modifier/3` et le routeur affiche le composant correspondant. Il faut surveiller la
  navigation, pas le clic.
- **Supprimer** est une action : c'est un `href="#"` intercepté par `(click)`. Le
  `$event.preventDefault()` empêche le saut vers le haut de la page (le comportement par défaut
  du `href="#"`).

La méthode appelée :

```ts
protected supprimer(id: number, nom: string): void {
  if (window.confirm(`Supprimer le produit « ${nom} » ?`)) {
    this.produitService.supprimer(id);
  }
}
```

La confirmation est indispensable : la suppression est immédiate et non annulable. Elle évite la
perte de données par un clic accidentel. Le service, lui, ne demande jamais : il exécute, il ne
dialogue pas avec l'utilisateur.

::figure captures/fig-00-2-liste-des-produits.png

**Figure 10.1** — Le tableau avec la colonne « Actions » contenant les liens « Modifier » et
« Supprimer ».

::figure
**Figure 10.2** — La boîte de confirmation native du navigateur après un clic sur « Supprimer ».

## 10.3 Ajouter un formulaire pour modifier un produit

*(Vidéo à 08:01)*

Le formulaire de modification reprend exactement la structure de celui d'ajout. Seules trois
différences le distinguent :

1. le `group({...})` contient un contrôle `id` supplémentaire ;
2. les valeurs initiales ne sont pas des valeurs par défaut, mais les données du produit
   courant, thanks à `patchValue()` ;
3. la soumission appelle `modifier()` et non `ajouter()`.

```ts
protected readonly produitForm = this.fb.nonNullable.group({
  id: [0],
  nom: ['', [Validators.required, Validators.minLength(3)]],
  description: ['', [Validators.required, Validators.minLength(5)]],
  prix: [0, [Validators.required, Validators.min(0.01)]],
  quantite: [1, [Validators.required, Validators.min(0)]],
  categorie: [this.categories[0], Validators.required],
});
```

### `reset()` ou `patchValue()` ?

- `reset(valeurs)` : le formulaire prend **exactement** les valeurs fournies. Utilisé après un
  ajout pour vider le formulaire.
- `patchValue(valeurs)` : seules les propriétés présentes sont écrasées, les autres sont
  conservées. Utilisé au chargement d'un produit existant.

`patchValue` est le bon choix ici : le formulaire existe déjà, on vient le remplir.

```ts
private remplirFormulaire(produit: Produit): void {
  this.produitForm.patchValue({
    id: produit.id,
    nom: produit.nom,
    description: produit.description,
    prix: produit.prix,
    quantite: produit.quantite,
    categorie: produit.categorie,
  });
  this.produitForm.markAsPristine();
}
```

`markAsPristine()` remet les contrôles à l'état « non modifié » : sans cela, `patchValue()`
déclencherait l'affichage immédiat des erreurs de validation.

### L'enregistrement

```ts
const { id: _ignore, ...modifications } = this.produitForm.getRawValue();
const ok = this.produitService.modifier(id, modifications);
```

La déconstruction `const { id: _ignore, ...modifications }` retire la propriété `id` de l'objet
avant de l'envoyer au service. L'identifiant ne voyage pas dans les modifications : il sert de
clé, il n'est pas une donnée éditable.

Dans le service, `modifier()` ne remplace pas tout l'objet ; il fusionne :

```ts
modifier(id: number, changement: ProduitSaisi): boolean {
  let trouve = false;
  this.produits.update((liste) =>
    liste.map((p) => {
      if (p.id !== id) return p;
      trouve = true;
      return { ...p, ...changement, prix: Number(changement.prix),
               quantite: Number(changement.quantite) };
    }),
  );
  if (trouve) this.persist();
  return trouve;
}
```

Le `map` parcourt toute la liste : la ligne non ciblée est renvoyée **inchangée**
(`if (p.id !== id) return p;`), ce qui évite de reconstruire les autres lignes.

::figure captures/fig-10-3-formulaire-modification.png

**Figure 10.3** — Le formulaire de modification rempli avec les données du produit sélectionné.

::figure captures/fig-10-7-confirmation-modification.png

**Figure 10.4** — Après validation : le tableau affiche la nouvelle valeur du produit modifié.

## 10.4 Transmettre des paramètres avec `ActivatedRoute`

*(Vidéo à 09:13)*

Pour que la page de modification sache **quel** produit modifier, l'identifiant est placé dans
l'URL. L'URL devient ainsi un état partageable : on peut envoyer le lien
`/produits/modifier/3` à quelqu'un, et la page affichera le produit 3.

### Étape 1 — déclarer le paramètre dans la table de routage

```ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'produits' },
  { path: 'produits', component: ProductList, title: 'Liste des produits' },
  { path: 'produits/ajouter', component: ProductAdd, title: 'Ajouter un produit' },
  // ':id' = paramètre dynamique. La valeur est lue dans ProductEdit via ActivatedRoute.
  { path: 'produits/modifier/:id', component: ProductEdit, title: 'Modifier un produit' },
  { path: '**', redirectTo: 'produits' },
];
```

`:id` déclare un segment dynamique. Le segment `ajouter` doit être déclaré **avant**
`modifier/:id`, sinon `ajouter` serait capté par `:id`.

### Étape 2 — lire le paramètre dans le composant

```ts
private readonly route = inject(ActivatedRoute);

private chargerProduit(): void {
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
```

### `snapshot` ou un observable ?

`ActivatedRoute` propose deux ways de lire un paramètre :

| Méthode | Quand l'utiliser |
| --- | --- |
| `this.route.snapshot.paramMap.get('id')` | La valeur est lue une seule fois, au chargement du composant. |
| `this.route.paramMap.subscribe(...)` (avec `toSignal`) | Le composant doit réagir à un changement de paramètre **sans** être recréé. |

Dans notre cas, `snapshot` suffit : chaque navigation vers `/produits/modifier/:id` recrée le
composant, donc la lecture est faite une fois pour la bonne valeur.

### La validation de la donnée reçue

Le paramètre d'URL est une **chaîne de caractères** venant de l'extérieur : rien ne garantit
qu'elle contient un entier. Les deux contrôles `!idParam` et `Number.isNaN(id)` convertissent ce
paramètre en donnée fiable avant tout accès au tableau des produits.

Si l'identifiant n'existe pas (par exemple `/produits/modifier/999`, ou après la suppression du
produit), le composant affiche un état « Produit introuvable » au lieu d'un formulaire vide.

::figure
**Figure 10.5** — La barre d'adresse affichant `localhost:4200/produits/modifier/3`.

::figure captures/fig-10-6-produit-introuvable.png

**Figure 10.6** — La page « Produit introuvable » sur l'URL `/produits/modifier/999`.

## 10.5 Naviguer entre les pages avec `Router`

*(Vidéo à 19:56)*

Le routage a trois composants : la table de routes, la sortie `<router-outlet />` et les
mécanismes de navigation.

### La sortie

```html
<main class="contenu">
  <router-outlet />
</main>
```

`<router-outlet />` est le emplacement de la page. Le routeur y **projette** le composant
correspondant à l'URL courante. Sans cet élément, rien ne s'affiche.

### Naviguer en code : `router.navigate()`

```ts
private readonly router = inject(Router);

this.router.navigate(['/produits']);
```

`navigate()` prend un tableau de segments, et non une chaîne : `['/produits']` évite les
problèmes d'échappement liés à une chaîne contenant des caractères spéciaux. On peut également
passer des paramètres :

```ts
this.router.navigate(['/produits/modifier', produit.id]);
```

### Naviguer dans le template : `routerLink`

```html
<a routerLink="/produits/ajouter">+ Ajouter un produit</a>
<a [routerLink]="['/produits/modifier', produit.id]">Modifier</a>
```

`routerLink` fait la même chose que `navigate()`, mais depuis le template. La directive
`routerLinkActive` permet de mettre en évidence le lien correspondant à la page affichée :

```html
<a routerLink="/produits" routerLinkActive="actif" [routerLinkActiveOptions]="{ exact: true }">
  Liste
</a>
```

L'option `{ exact: true }` est indispensable : sans elle, `/produits` serait considéré comme actif
aussi sur `/produits/modifier/3`, puisque le chemin commence par `/produits`.

### Les paramètres de requête

Le routeur distingue les **paramètres de chemin** (`:id`, visibles dans l'URL) des **paramètres
de requête** (après le `?`, non visibles dans le chemin). Un paramètre de requête est utile pour
transmettre un message d'une page à l'autre :

```ts
this.router.navigate(['/produits'], {
  queryParams: { modifie: this.produitForm.getRawValue().nom },
});
```

```ts
// Réception dans ProductList
protected readonly nomModifie = signal<string | null>(
  this.route.snapshot.queryParamMap.get('modifie'),
);
```

La confirmation s'affiche alors en haut du tableau :

```html
@if (nomModifie()) {
  <div class="alerte-confirmation">
    Produit « {{ nomModifie() }} » modifié avec succès.
    <a href="#" (click)="fermerMessage(); $event.preventDefault()">Fermer</a>
  </div>
}
```

::figure captures/fig-10-7-confirmation-modification.png

**Figure 10.7** — La barre d'adresse après la modification : `localhost:4200/produits?modifie=Lattes`,
avec le message de confirmation affiché au-dessus du tableau.

::figure captures/fig-00-2-liste-des-produits.png

**Figure 10.8** — Les deux onglets de la barre de navigation, avec l'onglet actif surligné.

## 10.6 Cacher le champ Id Produit ou le rendre Read Only

*(Vidéo à 02:35)*

L'identifiant joue le rôle de clé primaire. Il a été décidé dans l'URL, il sert à retrouver le
produit dans le service et il est utilisé comme clé de suivi par `@for`. Il ne doit **donc
jamais** pouvoir être modifié depuis le formulaire : le laisser éditable permettrait d'enregistrer
le produit 3 avec l'identifiant 7, et créerait un doublon.

L'atelier présente deux solutions. Les deux sont implémentées dans l'application, et l'utilisateur
bascule de l'une à l'autre avec une case à cocher.

### Solution A — cacher le champ

Le contrôle `id` reste dans le formulaire, mais le champ n'est pas rendu :

```html
@if (afficherId()) {
  <div class="champ champ-id">
    <label for="id">Id Produit</label>
    <input type="number" id="id" formControlName="id" readonly />
  </div>
}
```

```ts
protected readonly afficherId = signal(false);

protected basculerAffichageId(): void {
  this.afficherId.update((v) => !v);
}
```

Avantage : l'écran est plus épuré, l'utilisateur ne voit pas une donnée technique. Inconvénient :
la valeur n'est plus vérifiable à l'écran.

### Solution B — rendre le champ `readonly`

Le champ reste visible, mais l'identifiant ne peut pas être modifié :

```html
<input type="number" id="id" formControlName="id" readonly class="champ-lecture-seule" />
<small class="aide">Champ en lecture seule : l'identifiant ne peut pas être modifié.</small>
```

```css
.champ-lecture-seule {
  background: #eceff3 !important;
  color: #5a6472;
  cursor: not-allowed;
}
```

`readonly` autorise la sélection et la copie du texte, à la différence de `disabled` :

| Attribut | Copiable | Soumis avec le formulaire | Style |
| --- | --- | --- | --- |
| *(aucun)* | Oui | Oui | Normal |
| `readonly` | Oui | Oui | Le contrôle `FormControl` reste valide |
| `disabled` | Non | **Non** — la valeur est exclue de `form.value` | Grisé |

C'est pourquoi `disabled` serait un mauvais choix ici : le contrôle `id` disparaîtrait des
valeurs soumises, et la valeur du formulaire ne correspondrait plus à l'objet produit.

Le contrôle `id` est de toute façon retiré avant l'envoi par la déconstruction
`const { id: _ignore, ...modifications }`. Les deux protections se renforcent donc mutuellement :
l'interface empêche l'erreur de saisie, la déconstruction garantit que la valeur ne part pas.

::figure captures/fig-10-9-id-masque.png

**Figure 10.9** — Case à cocher « Afficher le champ Id Produit » décochée : le champ est absent
du formulaire.

::figure captures/fig-10-10-id-readonly.png

**Figure 10.10** — Case cochée : le champ « Id Produit » apparaît, grisé, avec le message
« Champ en lecture seule : l'identifiant ne peut pas être modifié. »

## 10.7 Récapitulatif de la section 10

| Étape | Élément mis en œuvre |
| --- | --- |
| Suppression | `<a href="#" (click)="supprimer(...)">` + `window.confirm()` |
| Modification | `FormGroup` pré-rempli par `patchValue()` + `markAsPristine()` |
| Paramètre d'URL | `:id` dans `app.routes.ts`, lu par `ActivatedRoute.snapshot.paramMap` |
| Navigation | `<router-outlet />`, `router.navigate()`, `routerLink`, `routerLinkActive` |
| Champ Id | `@if` pour le masquer, `readonly` pour le figer, déconstruction avant envoi |

---

## Tests réalisés

| # | Scénario | Résultat attendu | Résultat obtenu |
| --- | --- | --- | --- |
| 1 | Ajouter un produit valide | Le produit apparaît, compteur incrémenté | Conforme |
| 2 | Ajouter un produit sans nom | Champ rouge + message « Le nom est obligatoire » | Conforme |
| 3 | Prix négatif ou nul | Champ rouge + message d'erreur | Conforme |
| 4 | Description de 3 caractères | Champ rouge (minimum 5 caractères) | Conforme |
| 5 | Suppression d'une ligne | Ligne retirée, confirmation demandée | Conforme |
| 6 | Annulation de la confirmation | Aucune modification | Conforme |
| 7 | Table vide | Message « Aucun produit enregistré pour le moment. » | Conforme |
| 8 | Clic sur « Modifier » | Formulaire rempli avec les données du produit | Conforme |
| 9 | Validation du formulaire modifié | Valeurs mises à jour dans le tableau | Conforme |
| 10 | Affichage du champ Id | Champ grisé, non modifiable | Conforme |
| 11 | Rechargement de la page (F5) | Les données sont conservées | Conforme |
| 12 | URL `/produits/modifier/999` | Message « Produit introuvable » | Conforme |
| 13 | URL `/produits/modifier/abc` | Message « Produit introuvable » | Conforme |
| 14 | Retour arrière du navigateur | Navigation vers la liste, données à jour | Conforme |

::figure
**Figure T.1** — Résumé des tests dans le tableau ci-dessus, après exécution.

## Conclusion

Les sections 9 et 10 ont permis de mettre en place une application de gestion de produits
complète. Le passage du modèle au formulaire, puis du formulaire à la navigation entre pages,
illustre les trois apports principaux d'Angular : les **composants** pour découper l'interface, les
**services** pour centraliser la logique et les données, et le **routeur** pour gérer la
navigation.

Deux points ont demandé une attention particulière. D'abord l'identifiant du produit : il est
transmis par l'URL et figé dans le formulaire, car il conditionne à la fois la recherche dans le
service et le suivi des lignes par `@for`. Ensuite l'usage des **signals**, qui supprime toute
gestion manuelle de l'état affiché : chaque valeur dérivée est recalculée par le framework dès
que les données changent.

Les notions de `interface` contre `class`, de `snapshot` contre `paramMap`, et de `readonly`
contre `disabled` ont été reprises parce qu'elles reviennent dans toutes les applications
Angular : ce sont des choix de conception autant que des questions de syntaxe.

## Lien GitHub du code source

> **Dépôt :** `https://github.com/<votre-compte>/devoir2-angular-produits`
>
> L'arborescence des sections 9 et 10 se trouve dans `src/app/` :
> `models/produit.ts`, `services/product.service.ts`, `components/product-add/`,
> `components/product-edit/`, `components/product-list/` et `app.routes.ts`.

Pour lancer le projet :

```
npm install
npm start
```

Puis ouvrir `http://localhost:4200`.

---

## Annexe — Commandes utilisées

| Commande | Rôle |
| --- | --- |
| `ng new atelier-produits --style=css --routing` | Création du projet Angular. |
| `ng serve` | Démarrage du serveur de développement sur le port 4200. |
| `ng build` | Compilation de vérification du code. |
| `ng generate component product-add` | Génération du composant et de ses trois fichiers. |
| `ng generate service product` | Génération du service injectable. |

**Arborescence des fichiers concernés par le devoir :**

| Fichier | Section |
| --- | --- |
| `src/app/models/produit.ts` | 9.2 |
| `src/app/components/product-list/product-list.html` | 9.3, 10.2 |
| `src/app/components/product-add/product-add.ts` | 9.4 |
| `src/app/components/product-add/product-add.html` | 9.4 |
| `src/app/services/product.service.ts` | 9.5 |
| `src/app/components/product-edit/product-edit.ts` | 10.3, 10.4, 10.6 |
| `src/app/components/product-edit/product-edit.html` | 10.3, 10.6 |
| `src/app/app.routes.ts` | 10.4 |
| `src/app/app.html` | 10.5 |