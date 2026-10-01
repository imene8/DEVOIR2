// Génère le livrable Word `Devoir_02_Nadhem_BEL_HADJ.docx` à partir de
// `docs/RAPPORT_DEVOIR_02.md` (source unique). Syntaxes reconnues :
//   # / ## / ###      → titres
//   ```lang           → bloc de code Consolas ombré
//   ::toc             → page de garde + sommaire automatique
//   ::figure          → encadré « capture à insérer » + légende
//   | a | b |         → tableau (la 2e ligne est le séparateur)
//   - item / 1. item  → listes
//   ---               → saut de page
//   > texte           → encadré
//
// Usage : node tools/build-docx.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  LineRuleType,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(RACINE, 'docs', 'RAPPORT_DEVOIR_02.md');
const SORTIE = path.join(RACINE, 'docs', 'Devoir_02_Nadhem_BEL_HADJ.docx');

const GRIS_BORDURE = 'C6CEDB';
const GRIS_CODECH = 'F4F6F9';
const BLEU = '0D47A1';
const NB_HALF_POINTS = 17;

// ---------------------------------------------------------------- utilitaires
/** Convertit les espaces de début de ligne en insécables (alignement mono). */
const mono = (ligne) => ligne.replace(/^ /, (m) => '\u00A0'.repeat(m.length));

/** Découpe un texte en fragments { text, bold, code }. */
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

/** Un paragraphe de texte enrichi (gras + code inline). */
function paraRuns(brut, base = {}) {
  return segments(brut).map((s) => {
    const opts = { ...base };
    if (s.bold) opts.bold = true;
    if (s.code) {
      return new TextRun({
        text: s.text,
        font: 'Consolas',
        size: base.size ?? 19,
        color: 'A31515',
        ...(base.bold ? { bold: true } : {}),
      });
    }
    return new TextRun({ text: s.text, ...opts });
  });
}

function para(brut, opts = {}) {
  return new Paragraph({
    children: paraRuns(brut, opts.runs ?? {}),
    spacing: { after: opts.after ?? 120, line: 300, lineRule: LineRuleType.AUTO },
    alignment: opts.alignment,
    indent: opts.indent,
    pageBreakBefore: opts.pageBreakBefore,
  });
}

function titre(texte, level) {
  const titres = {
    1: HeadingLevel.TITLE,
    2: HeadingLevel.HEADING_1,
    3: HeadingLevel.HEADING_2,
    4: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    heading: titres[level],
    children: [new TextRun({ text: texte, bold: true })],
    spacing: { before: level === 1 ? 240 : 200, after: 140 },
  });
}

function blocCode(lignes, langage) {
  const enfants = [];
  if (langage) {
    enfants.push(
      new Paragraph({
        children: [new TextRun({ text: langage.toUpperCase(), bold: true, size: 15, color: BLEU })],
        spacing: { before: 80, after: 40 },
        shading: { type: ShadingType.CLEAR, fill: 'E7EDF6', color: 'auto' },
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
          left: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
          right: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
        },
      }),
    );
  }
  for (const ligne of lignes) {
    enfants.push(
      new Paragraph({
        children: [new TextRun({ text: mono(ligne) || ' ', font: 'Consolas', size: NB_HALF_POINTS })],
        spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
        shading: { type: ShadingType.CLEAR, fill: GRIS_CODECH, color: 'auto' },
        border: {
          left: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
          ...(ligne === lignes[lignes.length - 1] && !langage
            ? {}
            : {}),
        },
      }),
    );
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: GRIS_CODECH, color: 'auto' },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
              left: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
              right: { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE },
            },
            children: enfants,
          }),
        ],
      }),
    ],
  });
}

function encadreFigure(lignesLegende, image) {
  const enfantsLegende = lignesLegende.map(
    (l, i) =>
      new Paragraph({
        alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        children: paraRuns(l, {
          runs: { size: i === 0 ? 18 : 17, italics: i > 0, color: i === 0 ? '33465C' : '5A6B7D' },
        }),
        spacing: { after: i === 0 ? 40 : 0 },
      }),
  );

  if (!image) {
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: 'F7F9FC', color: 'auto' },
                margins: { top: 140, bottom: 140, left: 160, right: 160 },
                borders: {
                  top: { style: BorderStyle.DASHED, size: 6, color: '9BB0C9' },
                  bottom: { style: BorderStyle.DASHED, size: 6, color: '9BB0C9' },
                  left: { style: BorderStyle.DASHED, size: 6, color: '9BB0C9' },
                  right: { style: BorderStyle.DASHED, size: 6, color: '9BB0C9' },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '▢  CAPTURE D’ÉCRAN À INSÉRER  ▢',
                        bold: true,
                        size: 18,
                        color: '7A8899',
                      }),
                    ],
                    spacing: { after: 80 },
                  }),
                  ...enfantsLegende,
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '' })] }),
    ];
  }

  const LARGUEUR = 620;
  const ratio = image.largeur / image.hauteur;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          data: image.donnees,
          type: 'png',
          transformation: { width: LARGUEUR, height: Math.round(LARGUEUR / ratio) },
        }),
      ],
    }),
    ...enfantsLegende,
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '' })] }),
  ];
}

function tableauMarkdown(lignes) {
  const cellules = lignes
    .filter((l) => !/^\|[\s:|-]+\|$/.test(l.trim()))
    .map((l) =>
      l
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim()),
    );

  const enTete = cellules[0] ?? [];
  const corps = cellules.slice(1);

  const bord = { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDURE };
  const borders = { top: bord, bottom: bord, left: bord, right: bord };

  const mkCell = (texte, i, j) =>
    new TableCell({
      borders,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      shading:
        j === 0
          ? { type: ShadingType.CLEAR, fill: 'EEF2F8', color: 'auto' }
          : undefined,
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: paraRuns(texte, { runs: { size: j === 0 ? 19 : 19, bold: j === 0 } }),
        }),
      ],
    });

  const rows = [
    new TableRow({
      tableHeader: true,
      children: enTete.map((t, j) => mkCell(t, 0, j)),
    }),
    ...corps.map((r, i) => new TableRow({ children: r.map((c, j) => mkCell(c, i, j)) })),
  ];

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

// ------------------------------------------------------------------ parsing
const markdown = fs.readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');
const lignes = markdown.split('\n');

const corps = [];
const pageGarde = [];
let dansCode = false;
let fence = '';
let bufferCode = [];
let instanceListe = 0;
let listeCourante = null;

function viderListe() {
  listeCourante = null;
}

for (let i = 0; i < lignes.length; i++) {
  const l = lignes[i];

  if (l.startsWith('```')) {
    if (!dansCode) {
      dansCode = true;
      fence = l.slice(3).trim();
      bufferCode = [];
    } else {
      dansCode = false;
      corps.push(blocCode(bufferCode, fence));
      corps.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: '' })] }));
      bufferCode = [];
    }
    continue;
  }
  if (dansCode) {
    bufferCode.push(l);
    continue;
  }

  if (l.startsWith('::toc')) {
    corps.push(new Paragraph({ children: [new PageBreak()] }));
    corps.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Sommaire', bold: true })],
        spacing: { after: 200 },
      }),
    );
    corps.push(
      new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-3' }),
    );
    continue;
  }

  if (l.startsWith('::figure')) {
    // Le chemin peut contenir des espaces : on ne découpe pas sur les blancs.
    const source = l.slice('::figure'.length).trim() || null;
    const legende = [];
    let j = i + 1;
    while (j < lignes.length && lignes[j].trim() !== '') {
      legende.push(lignes[j].trim());
      j++;
    }
    i = j - 1;

    let image = null;
    if (source) {
      const chemin = path.join(RACINE, 'docs', source.replace(/\//g, path.sep));
      if (fs.existsSync(chemin)) {
        const donnees = fs.readFileSync(chemin);
        image = {
          donnees,
          largeur: donnees.readUInt32BE(16),
          hauteur: donnees.readUInt32BE(20),
        };
      }
    }
    corps.push(...encadreFigure(legende, image));
    continue;
  }

  if (l.trim() === '---') {
    viderListe();
    corps.push(new Paragraph({ children: [new PageBreak()] }));
    continue;
  }

  if (l.trim() === '') {
    viderListe();
    continue;
  }

  // Page de garde : tout ce qui précède ::toc
  if (corps.length === 0 && !pageGarde.length) {
    pageGarde.push(l);
    continue;
  }

  // Titres
  const mTitre = l.match(/^(#{1,4})\s+(.*)$/);
  if (mTitre) {
    viderListe();
    corps.push(titre(mTitre[2].trim(), mTitre[1].length));
    continue;
  }

  // Bloc de citation / encadré
  if (l.startsWith('> ')) {
    viderListe();
    const brut = l.replace(/^>\s?/, '');
    corps.push(
      new Paragraph({
        children: paraRuns(brut, { runs: { italics: true, size: 19 } }),
        indent: { left: 360 },
        spacing: { before: 80, after: 80, line: 300, lineRule: LineRuleType.AUTO },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: '4A7EBB' } },
        shading: { type: ShadingType.CLEAR, fill: 'F4F7FB', color: 'auto' },
      }),
    );
    continue;
  }

  // Tableaux
  if (l.trim().startsWith('|')) {
    viderListe();
    const bloc = [];
    let j = i;
    while (j < lignes.length && lignes[j].trim().startsWith('|')) {
      bloc.push(lignes[j]);
      j++;
    }
    i = j - 1;
    corps.push(tableauMarkdown(bloc));
    corps.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: '' })] }));
    continue;
  }

  // Listes à puces
  if (/^[-*]\s+/.test(l)) {
    const texte = l.replace(/^[-*]\s+/, '');
    if (listeCourante !== 'puce') {
      instanceListe += 1;
      listeCourante = 'puce';
    }
    corps.push(
      new Paragraph({
        children: paraRuns(texte, { runs: { size: 19 } }),
        numbering: { reference: 'puces', level: 0 },
        spacing: { after: 60, line: 300, lineRule: LineRuleType.AUTO },
      }),
    );
    continue;
  }

  // Listes numérotées
  const mNum = l.match(/^(\d+)\.\s+(.*)$/);
  if (mNum) {
    if (listeCourante !== `num-${mNum[1]}`) {
      instanceListe += 1;
      listeCourante = `num-${mNum[1]}`;
    }
    corps.push(
      new Paragraph({
        children: paraRuns(mNum[2], { runs: { size: 19 } }),
        numbering: { reference: 'numeros', level: 0, instance: instanceListe },
        spacing: { after: 60, line: 300, lineRule: LineRuleType.AUTO },
      }),
    );
    continue;
  }

  viderListe();
  corps.push(para(l.trim(), { runs: { size: 20 } }));
}

// --------------------------------------------------------------- page de garde
const titreDoc = (pageGarde.find((l) => l.startsWith('# ')) ?? '# Devoir 02').replace(/^#\s+/, '');
const metadonnees = pageGarde
  .filter((l) => /^\*\*.+?:\*\*/.test(l.trim()))
  .map((l) => l.trim().replace(/\*\*/g, ''));

const garde = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1200, after: 120 },
    children: [new TextRun({ text: 'RÉPUBLIQUE TUNISIENNE', bold: true, size: 22, color: '5A6B7D' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 900 },
    children: [
      new TextRun({
        text: 'MINISTÈRE DE L’ÉDUCATION NATIONALE\nET DES ENSEIGNEMENTS PRIMAIRES ET SECONDAIRES',
        size: 19,
        color: '5A6B7D',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 700 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLEU, space: 8 } },
    children: [new TextRun({ text: 'RAPPORT DE DEVOIR N° 02', bold: true, size: 30, color: '16202E' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1000 },
    children: [new TextRun({ text: titreDoc, bold: true, size: 30, color: BLEU })],
  }),
  ...metadonnees.flatMap((m) => {
    const idx = m.indexOf(':');
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({ text: m.slice(0, idx + 1), bold: true, size: 22, color: '33465C' }),
          new TextRun({ text: ' ' + m.slice(idx + 1).trim(), size: 22 }),
        ],
      }),
    ];
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1400 },
    children: [
      new TextRun({
        text: 'Année universitaire 2025 – 2026',
        italics: true,
        size: 20,
        color: '5A6B7D',
      }),
    ],
  }),
];

const doc = new Document({
  creator: 'Nadhem BEL HADJ',
  title: 'Devoir 02 — Angular : Ajout, Modification et Suppression des Produits',
  description: 'Rapport des sections 9 et 10 de l’atelier Angular',
  numbering: {
    config: [
      {
        reference: 'puces',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 460, hanging: 260 } } },
          },
        ],
      },
      {
        reference: 'numeros',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 460, hanging: 260 } } },
          },
        ],
      },
    ],
  },
  features: { updateFields: true },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
        },
      },
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
      children: [...garde, ...corps],
    },
  ],
});

fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(SORTIE, buffer);
console.log(`OK  ${SORTIE}  (${(buffer.length / 1024).toFixed(1)} Ko)`);