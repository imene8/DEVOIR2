// Contrôle du livrable « captures seules » : page de garde, 11 images,
// 11 légendes, aucun texte de rapport, aucun gabarit vide.
const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');

const cible = path.join(
  __dirname,
  '..',
  'docs',
  'Devoir_02_Captures_ecran_Nadhem_BEL_HADJ.docx',
);

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(cible));
  const noms = Object.keys(zip.files).filter((n) => !n.endsWith('/'));
  const xml = await zip.file('word/document.xml').async('string');
  const texte = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const nbImages = (xml.match(/<w:drawing>/g) || []).length;
  const nbLegendes = (xml.match(/Figure \d+\.\d+/g) || []).length;
  const nbGabarits = (xml.match(/CAPTURE D/g) || []).length;

  // Fragments de texte qui ne doivent pas subsister dans un document de captures.
  const intrus = [
    '9.1 Présentation de l’atelier',
    'Création de la classe Modèle',
    'Validators.required',
    'Conclusion',
    'Lien GitHub',
    'Annexe',
  ].filter((s) => texte.includes(s));

  const controles = [
    ['[Content_Types].xml', noms.includes('[Content_Types].xml')],
    ['word/document.xml', noms.includes('word/document.xml')],
    ['word/styles.xml', noms.includes('word/styles.xml')],
    ['word/footer1.xml', noms.includes('word/footer1.xml')],
    ['11 images', nbImages === 11, nbImages],
    ['11 légendes', nbLegendes === 11, nbLegendes],
    ['aucun gabarit vide', nbGabarits === 0, nbGabarits],
    ['page de garde', texte.includes('CAPTURES D’ÉCRAN')],
    ['sections 9 et 10', texte.includes('Sections 9 et 10')],
    ['nom de l’étudiant', texte.includes('Nadhem BEL HADJ')],
    ['capture ANHULAAR', texte.includes('bouton « Annuler »')],
    ['pied de page', (await zip.file('word/footer1.xml').async('string')).includes('PAGE')],
    ['aucun texte de rapport', intrus.length === 0, intrus.join(', ')],
  ];

  let echecs = 0;
  for (const [libelle, ok, detail] of controles) {
    if (!ok) echecs += 1;
    console.log(`${ok ? 'OK   ' : 'ECHEC'} ${libelle.padEnd(24)} ${detail ?? ''}`);
  }

  const media = noms.filter((n) => n.startsWith('word/media/'));
  console.log(`\nmédias : ${media.length} · taille : ${(fs.statSync(cible).size / 1024).toFixed(1)} Ko`);
  process.exitCode = echecs ? 1 : 0;
})();