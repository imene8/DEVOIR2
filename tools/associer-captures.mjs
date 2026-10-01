// Réassocie chaque bloc « ::figure » du rapport à la capture réelle qu'il doit
// embarquer. Sans correspondance, le convertisseur garde un simple encadré vide
// à compléter à la main (captures de VS Code, schémas, boîtes de dialogue).
const PLAN = {
  'Figure 0.2': 'captures/fig-00-2-liste-des-produits.png',
  'Figure 9.4': 'captures/fig-9-4-formulaire-ajout-vide.png',
  'Figure 9.5': 'captures/fig-9-5-formulaire-erreurs.png',
  'Figure 9.8': 'captures/fig-9-8-apres-ajout.png',
  'Figure 10.1': 'captures/fig-00-2-liste-des-produits.png',
  'Figure 10.3': 'captures/fig-10-3-formulaire-modification.png',
  'Figure 10.4': 'captures/fig-10-7-confirmation-modification.png',
  'Figure 10.6': 'captures/fig-10-6-produit-introuvable.png',
  'Figure 10.7': 'captures/fig-10-7-confirmation-modification.png',
  'Figure 10.8': 'captures/fig-00-2-liste-des-produits.png',
  'Figure 10.9': 'captures/fig-10-9-id-masque.png',
  'Figure 10.10': 'captures/fig-10-10-id-readonly.png',
};

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fichier = path.join(racine, 'docs', 'RAPPORT_DEVOIR_02.md');

let texte = fs.readFileSync(fichier, 'utf8').replace(/\r\n/g, '\n');
let injectes = 0;
let manquants = 0;

texte = texte.replace(/::figure\n([\s\S]*?)(?=\n\n)/g, (bloc) => {
  const m = bloc.match(/\*\*(Figure [^*]+)\*\*/);
  if (!m) return bloc;
  const cible = PLAN[m[1].trim()];
  if (!cible) {
    manquants += 1;
    return bloc;
  }
  if (!fs.existsSync(path.join(racine, 'docs', cible))) {
    console.warn(`  ! capture absente : ${cible}`);
    manquants += 1;
    return bloc;
  }
  injectes += 1;
  return `::figure ${cible}\n${bloc.replace('::figure', '')}`;
});

fs.writeFileSync(fichier, texte);
console.log(`Captures associées : ${injectes} · laissées en gabarit : ${manquants}`);