import fs from 'node:fs/promises';
import path from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import {LEVELS, pdfItems, parsePageText, recordsByLevel, type CefrLevel, type ParsedEntry} from './cefr-parser';

const root = path.resolve(import.meta.dirname, '..');
const sources = [
  path.join(root, 'docs', 'The_Oxford_3000_by_CEFR_level.pdf'),
  path.join(root, 'docs', 'The_Oxford_5000_by_CEFR_level.pdf'),
];
const expected = {A1: 737, A2: 747, B1: 761, B2: 1409, C1: 1315} satisfies Record<CefrLevel, number>;

const allEntries: ParsedEntry[] = [];
let currentLevel: CefrLevel | undefined;
for (const source of sources) {
  const pdf = await pdfjs.getDocument({data: new Uint8Array(await fs.readFile(source)), useWorkerFetch: false, isEvalSupported: false}).promise;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const parsed = parsePageText(pdfItems(content.items as Array<{str?: string; transform?: number[]}>), currentLevel);
    currentLevel = parsed.level;
    allEntries.push(...parsed.entries);
    page.cleanup();
  }
  await pdf.destroy();
}

const output = recordsByLevel(allEntries);
for (const level of LEVELS) {
  const actual = Object.keys(output[level]).length;
  if (actual !== expected[level]) throw new Error(`${level}: expected ${expected[level]} keys, parsed ${actual}`);
  const file = path.join(root, 'public', 'data', `cefr-${level.toLowerCase()}.json`);
  await fs.mkdir(path.dirname(file), {recursive: true});
  const sorted = Object.fromEntries(Object.entries(output[level]).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(file, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  console.log(`${level}: ${actual} keys -> ${path.relative(root, file)}`);
}
