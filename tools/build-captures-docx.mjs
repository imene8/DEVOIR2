// Génère `docs/Devoir_02_Captures_ecran_Nadhem_BEL_HADJ.docx` :
// page de garde suivie des seules captures d'écran, chacune avec son titre.
// Les figures et leurs légendes sont extraites de `docs/RAPPORT_DEVOIR_02.md`,
// qui reste la source unique — aucune légende n'est dupliquée ici.
//
// Usage : node tools/build-captures-docx.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  LineRuleType,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(RACINE, 'docs', 'RAPPORT_DEVOIR_02.md');
const SORTIE = path.join(RACINE, 'docs', 'Devoir_02_Captures_ecran_Nadhem_BEL_HADJ.docx');

const LARGUEUR = 620; // px — largeur utile de la page (16,5 cm)

// --------------------------------------------------- extraction des figures
const markdown = fs.readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');
const figures = [];

for (const bloc of markdown.match(/::figure\s+(\S.*\S|[^\s])?\n([\s\S]*?)(?=\n\n)/g) ?? []) {
  const lignes = bloc.split('\n');
  const source = lignes[0].slice('::figure'.length).trim();
  if (!source) continue;

  const fichier = path.join(RACINE, 'docs', source.replace(/\//g, path.sep));
  if (!fs.existsSync(fichier)) {
    console.warn(`  ! capture absente, ignorée : ${source}`);
    continue;
  }

  const donnees = fs.readFileSync(fichier);
  const legende = lignes
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean);

  figures.push({
    source,
    legende,
    donnees,
    largeur: donnees.readUInt32BE(16),
    hauteur: donnees.readUInt32BE(20),
  });
}

if (!figures.length) {
  console.error('Aucune capture trouvée dans le rapport.');
  process.exit(1);
}

// ---------------------------------------------------------- mise en forme
/** Découpe une légende en segments { text, bold, code }. */
function segments(brut) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let dernier = 0;
  let m;
  while ((m = re.exec(brut)) !== null) {
    if (m.index > dernier) out.push({ text: brut.slice(dernier, m.index) });
    const bloc = m[0];
    if (bloc.startsWith('**')) out.push({ text: bloc.slice(2, -2), bold: true });
    else out.push({ text: bloc.slice(1, -1), code: true });
    dernier = m.index + bloc.length;
  }
  if (dernier < brut.length) out.push({ text: brut.slice(dernier) });
  return out.length ? out : [{ text: brut }];
}

function para(brut, opts) {
  return new Paragraph({
    children: segments(brut).map((s) =>
      s.code
        ? new TextRun({ text: s.text, font: 'Consolas', size: 17, color: 'A31515', bold: s.bold })
        : new TextRun({ text: s.text, size: opts.size, bold: s.bold, italics: opts.italics, color: opts.color }),
    ),
    alignment: opts.alignment,
    spacing: { after: opts.after, line: 260, lineRule: LineRuleType.AUTO },
  });
}

const corps = figures.map((f, i) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: i === 0 ? 200 : 380, after: 80 },
    keepNext: true,
    children: [
      new ImageRun({
        data: f.donnees,
        type: 'png',
        transformation: {
          width: LARGUEUR,
          height: Math.round(LARGUEUR / (f.largeur / f.hauteur)),
        },
      }),
    ],
  }),
  ...f.legende.map((l, k) =>
    para(l, {
      size: k === 0 ? 19 : 17,
      italics: k > 0,
      bold: false,
      color: k === 0 ? '16202E' : '5A6B7D',
      alignment: k === 0 ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      after: k === 0 ? 40 : 0,
    }),
  ),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '' })] }),
]);

// ------------------------------------------------------------- page de garde
const garde = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2200, after: 140 },
    children: [new TextRun({ text: 'DEVOIR N° 02', bold: true, size: 34, color: '16202E' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 900 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '0D47A1', space: 8 } },
    children: [
      new TextRun({ text: 'Angular : Création de formulaire d’ajout,\nModification et Suppression des Produits', size: 26, color: '0D47A1' }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 700 },
    children: [new TextRun({ text: 'CAPTURES D’ÉCRAN', bold: true, size: 28, color: '0D47A1' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Sections 9 et 10', size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Réalisé par : Nadhem BEL HADJ', bold: true, size: 22, color: '33465C' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1200 },
    children: [new TextRun({ text: `${figures.length} captures d'écran`, italics: true, size: 20, color: '5A6B7D' })],
  }),
];

const doc = new Document({
  creator: 'Nadhem BEL HADJ',
  title: 'Devoir 02 — Captures d’écran (Angular, sections 9 et 10)',
  description: 'Captures d’écran de l’application de gestion de produits',
  features: { updateFields: true },
  sections: [
    {
      properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 } } },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Devoir 02 — Nadhem BEL HADJ  ·  page ', size: 15, color: '8A97A6' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 15, color: '8A97A6' }),
                new TextRun({ text: ' / ', size: 15, color: '8A97A6' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: '8A97A6' }),
              ],
            }),
          ],
        }),
      },
      children: [...garde, new Paragraph({ children: [new PageBreak()] }), ...corps.flat()],
    },
  ],
});

fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(SORTIE, buffer);

console.log(`OK  ${SORTIE}`);
console.log(`    ${figures.length} captures · ${(buffer.length / 1024).toFixed(1)} Ko`);
for (const f of figures) {
  const titre = f.legende[0]?.replace(/\*\*/g, '') ?? '(sans titre)';
  console.log(`    - ${titre}`);
}