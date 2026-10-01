// Contrôle du livrable Word : parties obligatoires, images embarquées,
// champ de sommaire, sauts de page, et absence de texte perdu.
const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');

const cible = path.join(__dirname, '..', 'docs', 'Devoir_02_Nadhem_BEL_HADJ.docx');

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(cible));
  const noms = Object.keys(zip.files).filter((n) => !n.endsWith('/'));
  const xml = await zip.file('word/document.xml').async('string');
  const rels = await zip.file('word/_rels/document.xml.rels').async('string');
  const media = noms.filter((n) => n.startsWith('word/media/'));
  const texte = xml.replace(/<[^>]+>/g, ' ');

  const controles = [
    ['[Content_Types].xml', noms.includes('[Content_Types].xml')],
    ['word/document.xml', noms.includes('word/document.xml')],
    ['word/styles.xml', noms.includes('word/styles.xml')],
    ['word/numbering.xml', noms.includes('word/numbering.xml')],
    ['word/footer1.xml', noms.includes('word/footer1.xml')],
    ['champ TOC', xml.includes('TOC \\h \\o')],
    ['sauts de page', (xml.match(/w:type="page"/g) || []).length >= 3],
    ['images incorporées', media.length > 0],
    ['blocs image', (xml.match(/<w:drawing>/g) || []).length],
    ['gabarits restants', (xml.match(/CAPTURE D/g) || []).length],
    ['tableaux', (xml.match(/<w:tbl>/g) || []).length],
    ['section 9', texte.includes('Section 9')],
    ['section 10', texte.includes('Section 10')],
    ['ActivatedRoute', texte.includes('ActivatedRoute')],
    ['nom de l’étudiant', texte.includes('Nadhem BEL HADJ')],
    ['pied de page', (await zip.file('word/footer1.xml').async('string')).includes('PAGE')],
  ];

  for (const [libelle, ok] of controles) {
    console.log(`${ok ? 'OK   ' : 'ECHEC'} ${libelle.padEnd(22)} ${typeof ok === 'number' ? ok : ''}`);
  }
  console.log(`\nfichiers média : ${media.length}`);
  for (const m of media) console.log('  ' + m);
  console.log(`\ntaille : ${(fs.statSync(cible).size / 1024).toFixed(1)} Ko`);
  console.log(`relations image : ${(rels.match(/media\//g) || []).length}`);
})();