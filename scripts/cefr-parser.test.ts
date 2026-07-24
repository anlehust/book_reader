import {describe, expect, it} from 'vitest';
import {mergeEntries, normalizeKey, parsePageText, recordsByLevel, removeSenseNumberSuffix} from './cefr-parser';

describe('CEFR parser helpers', () => {
  it('normalizes Unicode and removes sense suffixes only at the end', () => {
    expect(normalizeKey('  CAN’T  ')).toBe("can't");
    expect(normalizeKey('ＡＢＣ')).toBe('abc');
    expect(removeSenseNumberSuffix('can1')).toBe('can');
    expect(removeSenseNumberSuffix('lie2')).toBe('lie');
    expect(removeSenseNumberSuffix('second1')).toBe('second');
    expect(removeSenseNumberSuffix('level2up')).toBe('level2up');
  });

  it('parses a four-column row and keeps explanations in the key', () => {
    const parsed = parsePageText([
      {str: 'A1', x: 42.52, y: 700},
      {str: 'like', x: 303.64, y: 600},
      {str: '(similar)', x: 320, y: 600},
      {str: 'prep.', x: 347, y: 600},
    ]);
    expect(parsed.entries).toEqual([{word: 'like (similar)', pos: 'prep', level: 'A1'}]);
  });

  it('merges POS deterministically and keeps the hardest level', () => {
    const merged = mergeEntries([
      {word: 'read', pos: 'v.', level: 'A1'},
      {word: 'read', pos: 'n.', level: 'B1'},
      {word: 'read', pos: 'v.', level: 'A2'},
    ]);
    expect(merged.get('read')).toEqual({pos: 'n., v.', level: 'B1'});
  });

  it('places merged records in the level implied by the hardest occurrence', () => {
    const data = recordsByLevel([
      {word: 'read', pos: 'v.', level: 'A1'},
      {word: 'read', pos: 'n.', level: 'B1'},
    ]);
    expect(data.A1).toEqual({});
    expect(data.B1.read).toEqual({pos: 'n., v.', vi: ''});
  });

  it('fails loudly for an unparsed vocabulary row', () => {
    expect(() => parsePageText([
      {str: 'A1', x: 42.52, y: 700},
      {str: 'word', x: 42.52, y: 600},
      {str: 'unknown-pos', x: 60, y: 600},
    ])).toThrow(/Unparsed vocabulary row/);
  });
});
