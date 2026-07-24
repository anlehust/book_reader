export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type CefrLevel = (typeof LEVELS)[number];

export interface PdfRowItem {
  str: string;
  x: number;
  y: number;
}

export interface ParsedEntry {
  word: string;
  pos: string;
  level: CefrLevel;
}

export interface CefrRecord {
  pos: string;
  vi: '';
}

export const COLUMN_STARTS = [42.52, 173.08, 303.64, 434.2];
const COLUMN_ENDS = [172.5, 303, 433.5, 565];
const LEVEL_PATTERN = /^(A1|A2|B1|B2|C1)$/;
const POS_PATTERN = /^(?:adj|adv|auxiliary v|conj|definite article|det|exclam|indefinite article|infinitive marker|modal v|n|number|prep|pron|v)(?:\.)?(?:\s*\/\s*(?:adj|adv|auxiliary v|conj|det|exclam|n|number|prep|pron|v)(?:\.)?)*(?:\s*,\s*(?:adj|adv|auxiliary v|conj|definite article|det|exclam|indefinite article|infinitive marker|modal v|n|number|prep|pron|v)(?:\.)?(?:\s*\/\s*(?:adj|adv|auxiliary v|conj|det|exclam|n|number|prep|pron|v)(?:\.)?)*)*$/i;

function columnForX(x: number): number {
  const index = COLUMN_STARTS.findIndex((start, i) => x >= start - 0.2 && x <= COLUMN_ENDS[i] + 0.2);
  if (index < 0) throw new Error(`Text item is outside the four-column layout: x=${x}`);
  return index;
}

export function normalizeKey(word: string): string {
  return word.normalize('NFKC').replaceAll('’', "'").trim().toLowerCase();
}

export function removeSenseNumberSuffix(word: string): string {
  return word.replace(/(\D)\d+$/, '$1');
}

function cleanPos(pos: string): string {
  return pos.replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/').replace(/\s*,\s*/g, ', ').trim();
}

function parseRow(row: PdfRowItem[], level: CefrLevel): ParsedEntry | undefined {
  const visible = row.filter(item => item.str.trim().length > 0).sort((a, b) => a.x - b.x);
  if (visible.length < 2) return undefined;
  const word = visible[0].str.trim();
  if (!word || LEVEL_PATTERN.test(word) || /^\d+ \/ \d+$/.test(word)) return undefined;

  let rest = visible.slice(1).map(item => item.str).join('').trim();
  const explanations: string[] = [];
  while (rest.startsWith('(')) {
    const close = rest.indexOf(')');
    if (close < 0) throw new Error(`Unclosed explanation for row: ${row.map(item => item.str).join('')}`);
    explanations.push(rest.slice(0, close + 1));
    rest = rest.slice(close + 1).trim();
  }
  const pos = cleanPos(rest.replace(/[,.\/]+$/, ''));
  if (!POS_PATTERN.test(pos)) throw new Error(`Unparsed vocabulary row: ${row.map(item => item.str).join('')}`);
  const displayWord = `${removeSenseNumberSuffix(word)}${explanations.length ? ` ${explanations.join(' ')}` : ''}`;
  return {word: normalizeKey(displayWord), pos, level};
}

function splitSpellings(word: string): string[] {
  return /^a, an$/.test(word) ? ['a'] : [word];
}

export function expandEntry(entry: ParsedEntry): ParsedEntry[] {
  return splitSpellings(entry.word).map(word => ({...entry, word}));
}

export function rowsFromTextItems(items: PdfRowItem[]): PdfRowItem[][] {
  const rows = new Map<string, PdfRowItem[]>();
  for (const item of items) {
    if (!item.str.trim()) continue;
    const column = columnForX(item.x);
    const key = `${column}:${item.y.toFixed(2)}`;
    const row = rows.get(key) ?? [];
    row.push(item);
    rows.set(key, row);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => {
      const [columnA, yA] = a.split(':').map(Number);
      const [columnB, yB] = b.split(':').map(Number);
      return columnA - columnB || yB - yA;
    })
    .map(([, row]) => row.sort((a, b) => a.x - b.x));
}

export function parsePageText(items: PdfRowItem[], currentLevel?: CefrLevel): {entries: ParsedEntry[]; level: CefrLevel} {
  let level = currentLevel;
  const entries: ParsedEntry[] = [];
  for (const row of rowsFromTextItems(items)) {
    const text = row.map(item => item.str).join('').trim();
    const heading = text.match(LEVEL_PATTERN)?.[1] as CefrLevel | undefined;
    if (heading) {
      level = heading;
      continue;
    }
    if (!level || /^© Oxford University Press$/.test(text) || /^\d+ \/ \d+$/.test(text) || /^The Oxford/.test(text) || /^3000,/.test(text)) continue;
    const column = columnForX(row[0].x);
    if (Math.abs(row[0].x - COLUMN_STARTS[column]) > 1) continue;
    try {
      const entry = parseRow(row, level);
      if (entry) {
        if (entry.word !== 'ok') entries.push(...expandEntry(entry));
      }
    } catch (error) {
      throw new Error(`Failed to parse row (${text}): ${(error as Error).message}`, {cause: error});
    }
  }
  if (!level) throw new Error('No CEFR heading found before vocabulary rows');
  return {entries, level};
}

export function mergeEntries(entries: ParsedEntry[]): Map<string, {pos: string; level: CefrLevel}> {
  const merged = new Map<string, {pos: string; level: CefrLevel}>();
  const levelRank = new Map(LEVELS.map((level, index) => [level, index]));
  for (const entry of entries) {
    const previous = merged.get(entry.word);
    if (!previous) {
      merged.set(entry.word, {pos: entry.pos, level: entry.level});
      continue;
    }
    const positions = new Set(`${previous.pos}, ${entry.pos}`.split(', '));
    previous.pos = [...positions].sort().join(', ');
    if (levelRank.get(entry.level)! > levelRank.get(previous.level)!) previous.level = entry.level;
  }
  return merged;
}

export function recordsByLevel(entries: ParsedEntry[]): Record<CefrLevel, Record<string, CefrRecord>> {
  const output = Object.fromEntries(LEVELS.map(level => [level, {}])) as Record<CefrLevel, Record<string, CefrRecord>>;
  for (const [word, entry] of mergeEntries(entries)) output[entry.level][word] = {pos: entry.pos, vi: ''};
  return output;
}

export function pdfItems(items: Array<{str?: string; transform?: number[]}>): PdfRowItem[] {
  return items.flatMap(item => item.str && item.transform ? [{str: item.str, x: item.transform[4], y: item.transform[5]}] : []);
}
