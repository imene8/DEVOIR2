// Pilote l'application dans Edge headless : vérifie les parcours CRUD du devoir
// (sections 9 et 10) et produit les captures d'écran du rapport Word.
// Prérequis : `npx ng serve` en cours d'exécution.
// Usage : node tools/captures.mjs [http://localhost:4300]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = path.join(RACINE, 'docs', 'captures');
const BASE = process.argv[2] ?? 'http://localhost:4300';

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => fs.existsSync(p));

fs.mkdirSync(DOSSIER, { recursive: true });

const erreurs = [];
const journal = [];

function ok(etape, detail = '') {
  journal.push(`  OK   ${etape}${detail ? ' — ' + detail : ''}`);
}
function ko(etape, detail) {
  erreurs.push(`  ECHEC ${etape}${detail ? ' — ' + detail : ''}`);
  journal.push(`  ECHEC ${etape}${detail ? ' — ' + detail : ''}`);
}

async function capture(page, nom) {
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: path.join(DOSSIER, `${nom}.png`) });
  journal.push(`  IMG  ${nom}.png`);
}

async function aller(page, url) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('body');
}

async function texte(page, selecteur) {
  return page.$eval(selecteur, (el) => el.textContent.trim()).catch(() => null);
}

async function valeur(page, selecteur) {
  return page.$eval(selecteur, (el) => el.value).catch(() => null);
}

async function compter(page, selecteur) {
  return page.$$eval(selecteur, (els) => els.length).catch(() => 0);
}

const navigateur = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--window-size=1600,1000', '--force-device-scale-factor=1'],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await navigateur.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(`  CONSOLE ${m.text()}`);
});
page.on('pageerror', (e) => erreurs.push(`  PAGEERROR ${e.message}`));

try {
  // ---- État de départ déterministe ---------------------------------------
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());

  // ---- Chargement initial ------------------------------------------------
  await aller(page, '/');
  await page.waitForSelector('.table-produits tbody tr');
  const lignes = await compter(page, '.table-produits tbody tr');
  lignes >= 4 ? ok('Chargement de la liste', `${lignes} produits`) : ko('Chargement de la liste', `${lignes} lignes`);
  await capture(page, 'fig-00-2-liste-des-produits');

  // ---- Section 9 : formulaire d'ajout ------------------------------------
  await page.click('a[href="/produits/ajouter"]');
  await page.waitForSelector('#nom');
  (await page.url()).endsWith('/produits/ajouter') ? ok('Navigation vers /produits/ajouter') : ko('Navigation vers /produits/ajouter', page.url());
  await capture(page, 'fig-9-4-formulaire-ajout-vide');

  // soumission vide → erreurs de validation
  await page.click('button[type="submit"]');
  await page.waitForSelector('.erreur');
  const nbErreurs = await compter(page, '.erreur');
  nbErreurs >= 3 ? ok('Validation du formulaire', `${nbErreurs} messages d'erreur`) : ko('Validation du formulaire', `${nbErreurs} erreurs`);
  await capture(page, 'fig-9-5-formulaire-erreurs');

  // remplissage valide
  await page.type('#nom', 'Lattes');
  await page.type('#description', 'Boisson lactée, brique de 1 L, marque generics.');
  await page.$eval('#prix', (el) => (el.value = ''));
  await page.type('#prix', '2.35');
  await page.$eval('#quantite', (el) => (el.value = ''));
  await page.type('#quantite', '150');
  await page.select('#categorie', 'Boissons');

  // ---- Section 10 : modification du premier produit ---------------------
  await aller(page, '/produits');
  await page.click('.table-produits tbody tr:first-child .lien-action');
  await page.waitForSelector('#nom');
  const urlModif = page.url();
  /\/produits\/modifier\/\d+$/.test(urlModif) ? ok('Lien Modifier', urlModif) : ko('Lien Modifier', urlModif);

  const idAffiche = await valeur(page, '#id');
  const nomCharge = await valeur(page, '#nom');
  const prixCharge = await valeur(page, '#prix');
  nomCharge && prixCharge
    ? ok('Formulaire de modification pré-rempli', `nom = ${nomCharge}, prix = ${prixCharge}`)
    : ko('Formulaire de modification pré-rempli', `nom = ${nomCharge}, prix = ${prixCharge}`);
  await capture(page, 'fig-10-3-formulaire-modification');

  // champ Id masqué par défaut, puis affiché en lecture seule
  const idPresent = (await page.$('#id')) !== null;
  idPresent ? ko('Champ Id masqué par défaut', 'il est rendu dans le DOM') : ok('Champ Id masqué par défaut');
  await capture(page, 'fig-10-9-id-masque');
  await page.click('.case-a-cocher input');
  await page.waitForSelector('#id');
  const readonly = await page.$eval('#id', (el) => el.hasAttribute('readonly'));
  readonly ? ok('Champ Id en lecture seule', 'attribut readonly présent') : ko('Champ Id en lecture seule', 'readonly absent');
  const idRempli = await valeur(page, '#id');
  const idUrl = new URL(urlModif).pathname.split('/').pop();
  idRempli === idUrl ? ok('Champ Id pré-rempli', `id = ${idRempli}`) : ko('Champ Id pré-rempli', `${idRempli} ≠ ${idUrl}`);
  await capture(page, 'fig-10-10-id-readonly');

  // modification effective
  await page.$eval('#prix', (el) => (el.value = ''));
  await page.type('#prix', '39.9');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.table-produits tbody tr');
  const urlApres = page.url();
  urlApres.includes('modifie=') ? ok('Retour à la liste avec queryParam', urlApres) : ko('Retour à la liste avec queryParam', urlApres);
  (await page.$('.alerte-confirmation')) !== null
    ? ok('Message de confirmation affiché')
    : ko('Message de confirmation affiché');
  await capture(page, 'fig-10-7-confirmation-modification');

  // ---- Ajout effectif ----------------------------------------------------
  await aller(page, '/produits/ajouter');
  await page.type('#nom', 'Lattes');
  await page.type('#description', 'Boisson lactée, brique de 1 L, marque generics.');
  await page.$eval('#prix', (el) => (el.value = ''));
  await page.type('#prix', '2.35');
  await page.$eval('#quantite', (el) => (el.value = ''));
  await page.type('#quantite', '150');
  await page.select('#categorie', 'Boissons');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.table-produits tbody tr');
  const apresAjout = await compter(page, '.table-produits tbody tr');
  const badge = await texte(page, '.badge');
  apresAjout === lignes + 1 ? ok('Ajout d’un produit', `${apresAjout} produits (${badge})`) : ko('Ajout d’un produit', `${apresAjout} lignes, attendu ${lignes + 1}`);
  await capture(page, 'fig-9-8-apres-ajout');

  // ---- Suppression --------------------------------------------------------
  page.once('dialog', async (d) => {
    await d.accept();
  });
  const dernier = await page.$$('.table-produits tbody tr');
  await dernier[dernier.length - 1].$eval('.lien-supprimer', (el) => el.click());
  await new Promise((r) => setTimeout(r, 400));
  const apresSuppression = await compter(page, '.table-produits tbody tr');
  apresSuppression === apresAjout - 1
    ? ok('Suppression d’un produit', `${apresSuppression} produits`)
    : ko('Suppression d’un produit', `${apresSuppression} lignes`);

  // ---- Cas d'erreur : identifiant inexistant ------------------------------
  await aller(page, '/produits/modifier/9999');
  const introuvable = (await page.$('.introuvable')) !== null;
  introuvable ? ok('Produit introuvable (id 9999)') : ko('Produit introuvable (id 9999)');
  await capture(page, 'fig-10-6-produit-introuvable');

  await aller(page, '/produits/modifier/abc');
  (await page.$('.introuvable')) !== null
    ? ok('Produit introuvable (id non numérique)')
    : ko('Produit introuvable (id non numérique)');

  // ---- Persistance après rechargement -------------------------------------
  await aller(page, '/produits');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.table-produits tbody tr');
  const apresReload = await compter(page, '.table-produits tbody tr');
  apresReload === apresSuppression
    ? ok('Persistance après rechargement', `${apresReload} produits`)
    : ko('Persistance après rechargement', `${apresReload} lignes, attendu ${apresSuppression}`);
} catch (e) {
  erreurs.push(`  EXCEPTION ${e.message}`);
} finally {
  await navigateur.close();
}

console.log('\n— Parcours vérifiés —');
console.log(journal.join('\n'));
if (erreurs.length) {
  console.log('\n— Anomalies —');
  console.log(erreurs.join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nTout est conforme.');
}