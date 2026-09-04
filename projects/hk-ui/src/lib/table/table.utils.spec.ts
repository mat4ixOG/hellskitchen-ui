import {
  aggregate,
  applyColumnState,
  assignField,
  buildHeaderRows,
  compileFilter,
  csvCell,
  defaultCompare,
  deriveOptions,
  flattenLeaves,
  isFilterInactive,
  matches,
  resolveField,
  searchText,
  toDate,
  toCsv,
  toNumber
} from './table.utils';
import { HkColumn } from './table.types';

/** A three-deep tree: the shape the header matrix has to get right. */
const COLUMNS: HkColumn[] = [
  { key: 'name', header: 'Name' },
  {
    key: 'revenue',
    header: 'Revenue',
    children: [
      { key: 'q1', header: 'Q1', numeric: true, aggregate: 'sum' },
      {
        key: 'h2',
        header: 'H2',
        children: [
          { key: 'q3', header: 'Q3', numeric: true },
          { key: 'q4', header: 'Q4', numeric: true }
        ]
      }
    ]
  },
  { key: 'margin', header: 'Margin', numeric: true, aggregate: 'avg' }
];

describe('table.utils', () => {
  describe('resolveField', () => {
    it('walks a dotted path', () => {
      expect(resolveField({ a: { b: { c: 7 } } }, 'a.b.c')).toBe(7);
    });

    it('stops at a nullish hop instead of throwing', () => {
      expect(resolveField({ a: null }, 'a.b.c')).toBeUndefined();
      expect(resolveField(null, 'a')).toBeUndefined();
    });
  });

  describe('flattenLeaves', () => {
    it('returns leaves left to right with dotted ids', () => {
      const leaves = flattenLeaves(COLUMNS);
      expect(leaves.map((leaf) => leaf.id)).toEqual([
        'name',
        'revenue.q1',
        'revenue.h2.q3',
        'revenue.h2.q4',
        'margin'
      ]);
      expect(leaves.map((leaf) => leaf.index)).toEqual([0, 1, 2, 3, 4]);
    });

    it('records the ancestor chain so a leaf can resolve group settings', () => {
      const deep = flattenLeaves(COLUMNS).find((leaf) => leaf.id === 'revenue.h2.q3')!;
      expect(deep.ancestors.map((node) => node.key)).toEqual(['revenue', 'h2']);
      expect(deep.parent?.key).toBe('h2');
    });

    it('skips hidden columns and groups whose every child is hidden', () => {
      const columns: HkColumn[] = [
        { key: 'a' },
        { key: 'g', children: [{ key: 'x', hidden: true }, { key: 'y', hidden: true }] }
      ];
      expect(flattenLeaves(columns).map((leaf) => leaf.id)).toEqual(['a']);
    });
  });

  describe('buildHeaderRows', () => {
    const rows = buildHeaderRows(COLUMNS, flattenLeaves(COLUMNS));

    it('renders one row per level of the tree', () => {
      expect(rows.length).toBe(3);
    });

    it('spans a group across its visible leaves', () => {
      const revenue = rows[0].find((cell) => cell.column.key === 'revenue')!;
      expect(revenue.colSpan).toBe(3);
      expect(revenue.isLeaf).toBeFalse();
    });

    it('stretches a shallow leaf down to the deepest row', () => {
      const name = rows[0].find((cell) => cell.column.key === 'name')!;
      expect(name.rowSpan).toBe(3);
      expect(name.colSpan).toBe(1);
    });

    it('gives the deepest leaves a rowspan of one', () => {
      expect(rows[2].map((cell) => cell.column.key)).toEqual(['q3', 'q4']);
      expect(rows[2].every((cell) => cell.rowSpan === 1)).toBeTrue();
    });
  });

  describe('applyColumnState', () => {
    it('hides, sizes and reorders without touching the input', () => {
      const next = applyColumnState(
        COLUMNS,
        new Set(['revenue.q1']),
        { name: '12rem' },
        ['margin', 'revenue', 'name']
      );
      expect(next.map((column) => column.key)).toEqual(['margin', 'revenue', 'name']);
      expect(next.find((column) => column.key === 'name')!.width).toBe('12rem');
      expect(COLUMNS[0].width).toBeUndefined();
      expect(flattenLeaves(next).map((leaf) => leaf.id)).not.toContain('revenue.q1');
    });
  });

  describe('defaultCompare', () => {
    it('sorts numeric strings as numbers, not as text', () => {
      expect(defaultCompare('9', '10')).toBeLessThan(0);
      expect(defaultCompare('1,200', '900')).toBeGreaterThan(0);
    });

    it('puts nullish values first and compares dates chronologically', () => {
      expect(defaultCompare(null, 'a')).toBeLessThan(0);
      expect(defaultCompare(new Date(2026, 0, 2), new Date(2026, 0, 1))).toBeGreaterThan(0);
    });
  });

  describe('compileFilter', () => {
    it('matches contains case-insensitively', () => {
      const test = compileFilter({ value: 'API', matchMode: 'contains' });
      expect(test('billing-api')).toBeTrue();
      expect(test('search-index')).toBeFalse();
    });

    it('negates notContains', () => {
      const test = compileFilter({ value: 'api', matchMode: 'notContains' });
      expect(test('billing-api')).toBeFalse();
      expect(test('search-index')).toBeTrue();
    });

    it('treats an "in" list as a set membership check', () => {
      const test = compileFilter({ value: ['EMEA', 'APAC'], matchMode: 'in' });
      expect(test('APAC')).toBeTrue();
      expect(test('Americas')).toBeFalse();
    });

    it('never drops rows for an empty "in" list', () => {
      expect(compileFilter({ value: [], matchMode: 'in' })('anything')).toBeTrue();
    });

    it('compares numerically for the relational modes', () => {
      expect(compileFilter({ value: 100, matchMode: 'gte' })('100')).toBeTrue();
      expect(compileFilter({ value: 100, matchMode: 'gt' })('100')).toBeFalse();
      expect(compileFilter({ value: 100, matchMode: 'lt' })(99)).toBeTrue();
    });

    it('reports blank and non-blank', () => {
      expect(compileFilter({ value: true, matchMode: 'empty' })('')).toBeTrue();
      expect(compileFilter({ value: true, matchMode: 'notEmpty' })(0)).toBeTrue();
    });
  });

  describe('matches (generic path)', () => {
    it('handles a numeric between range inclusively', () => {
      const meta = { value: 10, value2: 20, matchMode: 'between' as const };
      expect(matches(10, meta)).toBeTrue();
      expect(matches(20, meta)).toBeTrue();
      expect(matches(21, meta)).toBeFalse();
    });

    it('keeps a one-sided numeric range numeric', () => {
      // Regression: the date/number branch was chosen from `toNumber(needle)`
      // alone, so an empty lower bound sent a numeric range down the date path
      // and compared cells as millisecond timestamps — everything inside the
      // same 1970 day passed, and "at most 10" matched 50,000.
      const atMost10 = { value: '', value2: 10, matchMode: 'between' as const };
      expect(matches(5, atMost10)).toBeTrue();
      expect(matches(10, atMost10)).toBeTrue();
      expect(matches(20, atMost10)).toBeFalse();
      expect(matches(50000, atMost10)).toBeFalse();

      const atLeast10 = { value: 10, value2: null, matchMode: 'between' as const };
      expect(matches(50000, atLeast10)).toBeTrue();
      expect(matches(9, atLeast10)).toBeFalse();
    });

    it('still reads a one-sided date range as dates', () => {
      const upto = { value: '', value2: '2026-03-05', matchMode: 'between' as const };
      expect(matches(new Date(2026, 2, 5, 23, 30), upto)).toBeTrue();
      expect(matches(new Date(2026, 2, 6, 0, 30), upto)).toBeFalse();
    });

    it('equates values across the string/number boundary', () => {
      expect(matches('42', { value: 42, matchMode: 'equals' })).toBeTrue();
    });

    it('compares dates by day, ignoring the clock', () => {
      const meta = { value: '2026-03-02', matchMode: 'dateIs' as const };
      // Local dates on purpose: an instant is only "the same day" in some
      // timezone, and the filter means the user's calendar day.
      expect(matches(new Date(2026, 2, 2, 18, 45), meta)).toBeTrue();
      expect(matches(new Date(2026, 2, 2, 0, 0), meta)).toBeTrue();
      expect(matches(new Date(2026, 2, 3, 0, 10), meta)).toBeFalse();
    });

    it('reads a date-only filter as a local calendar day, not UTC midnight', () => {
      // Regression: `new Date('2026-03-02')` is UTC midnight, which is the
      // previous day west of UTC — the filter used to be off by a day there.
      const parsed = toDate('2026-03-02')!;
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(2);
      expect(parsed.getDate()).toBe(2);
      expect(parsed.getHours()).toBe(0);
    });

    it('does not mutate the date it is handed', () => {
      const cell = new Date(2026, 2, 2, 9, 30);
      const before = cell.getTime();
      matches(cell, { value: '2026-03-01', matchMode: 'dateAfter' });
      matches(cell, { value: '2026-03-01', value2: '2026-03-05', matchMode: 'between' });
      expect(cell.getTime()).toBe(before);
    });
  });

  describe('isFilterInactive', () => {
    it('ignores a filter with nothing in it', () => {
      expect(isFilterInactive(undefined)).toBeTrue();
      expect(isFilterInactive({ value: '', matchMode: 'contains' })).toBeTrue();
      expect(isFilterInactive({ value: [], matchMode: 'in' })).toBeTrue();
    });

    it('keeps the value-less modes active', () => {
      expect(isFilterInactive({ value: null, matchMode: 'empty' })).toBeFalse();
    });

    it('stays active when only one end of a range is set', () => {
      expect(isFilterInactive({ value: null, value2: 9, matchMode: 'between' })).toBeFalse();
    });
  });

  describe('aggregate', () => {
    const rows = [{ n: 10 }, { n: 20 }, { n: null }, { n: '30' }];

    it('sums, averages and bounds only the parseable numbers', () => {
      expect(aggregate(rows, { key: 'n', aggregate: 'sum' }, 'n')).toBe(60);
      expect(aggregate(rows, { key: 'n', aggregate: 'avg' }, 'n')).toBe(20);
      expect(aggregate(rows, { key: 'n', aggregate: 'min' }, 'n')).toBe(10);
      expect(aggregate(rows, { key: 'n', aggregate: 'max' }, 'n')).toBe(30);
    });

    it('bounds a column far past the argument limit', () => {
      // Regression: `Math.min(...numbers)` pushed one argument per row and
      // threw RangeError somewhere north of ~125k — on exactly the row counts
      // the virtual-scrolling grid exists to handle.
      const many = Array.from({ length: 200_000 }, (_, i) => ({ n: i }));
      expect(aggregate(many, { key: 'n', aggregate: 'min' }, 'n')).toBe(0);
      expect(aggregate(many, { key: 'n', aggregate: 'max' }, 'n')).toBe(199_999);
    });

    it('counts rows, not values', () => {
      expect(aggregate(rows, { key: 'n', aggregate: 'count' }, 'n')).toBe(4);
    });

    it('accepts a custom reducer', () => {
      expect(aggregate(rows, { key: 'n', aggregate: (list) => list.length * 2 }, 'n')).toBe(8);
    });

    it('returns null rather than NaN when nothing is numeric', () => {
      expect(aggregate([{ n: 'x' }], { key: 'n', aggregate: 'sum' }, 'n')).toBeNull();
    });
  });

  describe('deriveOptions', () => {
    it('returns sorted distinct values and drops blanks', () => {
      const options = deriveOptions([{ r: 'b' }, { r: 'a' }, { r: 'b' }, { r: '' }], 'r');
      expect(options.map((option) => option.value)).toEqual(['a', 'b']);
    });
  });

  describe('csv', () => {
    it('quotes only the fields that need it', () => {
      expect(csvCell('plain')).toBe('plain');
      expect(csvCell('a,b')).toBe('"a,b"');
      expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    });

    it('joins with CRLF so Excel reads it', () => {
      expect(toCsv(['a', 'b'], [[1, 2]])).toBe('a,b\r\n1,2');
    });

    it('quotes against the separator actually in use', () => {
      // Quoting only against ',' while joining on ';' shifts every column after
      // the offending cell.
      expect(csvCell('a;b', ';')).toBe('"a;b"');
      expect(toCsv(['x', 'y'], [['a;b', 'c']], ';')).toBe('x;y\r\n"a;b";c');
      // And a comma is just data once ';' is the separator.
      expect(csvCell('a,b', ';')).toBe('a,b');
    });

    it('defuses spreadsheet formulas without touching numbers', () => {
      expect(csvCell('=1+1')).toBe('\t=1+1');
      expect(csvCell('=HYPERLINK("http://x","go")')).toBe(
        '"\t=HYPERLINK(""http://x"",""go"")"'
      );
      expect(csvCell('@SUM(A1)')).toBe('\t@SUM(A1)');
      expect(csvCell('+cmd|calc')).toBe('\t+cmd|calc');
      // Negative and signed numbers are data, not formulas.
      expect(csvCell(-5)).toBe('-5');
      expect(csvCell('-12.5')).toBe('-12.5');
      expect(csvCell('+7')).toBe('+7');
      expect(csvCell('-1e3')).toBe('-1e3');
      // ...but a leading '-' on something non-numeric is not.
      expect(csvCell('-1+1')).toBe('\t-1+1');
    });
  });

  describe('assignField', () => {
    it('writes through a dotted path instead of creating a literal key', () => {
      const row: Record<string, any> = { address: { city: 'Oslo', zip: '0150' } };
      assignField(row, 'address.city', 'Bergen');
      expect(row['address'].city).toBe('Bergen');
      expect(row['address'].zip).toBe('0150');
      expect(row['address.city']).toBeUndefined();
    });

    it('creates the intermediate objects it needs', () => {
      const row: Record<string, any> = {};
      assignField(row, 'a.b.c', 1);
      expect(row['a'].b.c).toBe(1);
    });
  });

  describe('toCsv separator', () => {
    it('quotes against the separator actually in use', () => {
      // A `;` export that quotes only against `,` shifts every column after
      // the first cell containing a semicolon.
      const csv = toCsv(['a', 'b'], [['x;y', 'z']], ';');
      expect(csv.split('\r\n')[1]).toBe('"x;y";z');
    });

    it('leaves a comma unquoted when the separator is not a comma', () => {
      const csv = toCsv(['a'], [['1,240']], ';');
      expect(csv.split('\r\n')[1]).toBe('1,240');
    });
  });

  describe('misc helpers', () => {
    it('parses grouped numbers and rejects junk', () => {
      expect(toNumber('1,240')).toBe(1240);
      expect(toNumber('abc')).toBeNull();
      expect(toNumber('')).toBeNull();
    });

    it('lowercases search text without touching numbers', () => {
      expect(searchText('AbC')).toBe('abc');
      expect(searchText(42)).toBe('42');
      expect(searchText(null)).toBe('');
    });
  });
});
