import {
  aggregate,
  compileFilter,
  defaultCompare,
  deriveOptions,
  resolveField,
  searchText,
  toCsv
} from './table.utils';

/**
 * Performance guards for the hot paths, at the row counts the grid claims to
 * handle. These are not micro-benchmarks — they exist to catch an accidental
 * O(n²) or a per-row allocation creeping into a code path that gets run a
 * hundred thousand times.
 *
 * Budgets are deliberately loose (roughly 5-10x the observed time on a normal
 * machine) so a slow CI box does not fail the build, while an algorithmic
 * regression still will.
 */
describe('table performance at 100k rows', () => {
  const COUNT = 100_000;
  const REGIONS = ['EMEA', 'APAC', 'AMER', 'LATAM'];

  interface Row {
    id: number;
    service: string;
    region: string;
    units: number;
    nested: { revenue: number };
  }

  let rows: Row[];

  beforeAll(() => {
    rows = Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      service: `service-${i % 977}`,
      region: REGIONS[i % REGIONS.length],
      units: (i * 7919) % 10_000,
      nested: { revenue: (i * 104_729) % 1_000_000 }
    }));
  });

  const time = (label: string, work: () => void): number => {
    const started = performance.now();
    work();
    const ms = performance.now() - started;
    // Surfaced so a regression is visible in the run, not just a red test.
    console.log(`  [perf] ${label}: ${ms.toFixed(1)}ms`);
    return ms;
  };

  it('resolves a dot path across every row well under a frame budget', () => {
    const ms = time('resolveField x100k (nested)', () => {
      for (const row of rows) resolveField(row, 'nested.revenue');
    });
    expect(ms).toBeLessThan(300);
  });

  it('filters with a compiled predicate in one pass', () => {
    // The whole point of compiling: the operand is normalised once, not
    // re-parsed per row.
    const predicate = compileFilter({ value: 'service-1', matchMode: 'contains' });
    let kept = 0;
    const ms = time('compiled contains x100k', () => {
      for (const row of rows) if (predicate(row.service)) kept++;
    });
    expect(kept).toBeGreaterThan(0);
    expect(ms).toBeLessThan(300);
  });

  it('sorts 100k rows without the comparator degrading', () => {
    const copy = [...rows];
    const ms = time('sort x100k (numeric)', () => {
      copy.sort((a, b) => defaultCompare(a.units, b.units));
    });
    expect(copy[0].units).toBeLessThanOrEqual(copy[copy.length - 1].units);
    expect(ms).toBeLessThan(3000);
  });

  it('runs a global search across several fields in one pass', () => {
    const needle = 'service-42';
    let hits = 0;
    const ms = time('global search x100k x3 fields', () => {
      for (const row of rows) {
        if (
          searchText(row.service).includes(needle) ||
          searchText(row.region).includes(needle) ||
          searchText(row.units).includes(needle)
        ) {
          hits++;
        }
      }
    });
    expect(hits).toBeGreaterThan(0);
    expect(ms).toBeLessThan(600);
  });

  it('aggregates a column without blowing the stack or the budget', () => {
    // Regression: this used `Math.min(...numbers)`, which threw RangeError
    // somewhere north of ~125k arguments.
    let result: unknown;
    const ms = time('aggregate min/max/sum x100k', () => {
      result = aggregate(rows, { key: 'units', aggregate: 'min' }, 'units');
      aggregate(rows, { key: 'units', aggregate: 'max' }, 'units');
      aggregate(rows, { key: 'units', aggregate: 'sum' }, 'units');
    });
    expect(result).toBe(0);
    expect(ms).toBeLessThan(500);
  });

  it('derives filter options without scanning quadratically', () => {
    let options: unknown[] = [];
    const ms = time('deriveOptions x100k (977 distinct)', () => {
      options = deriveOptions(rows, 'service');
    });
    expect(options.length).toBe(977);
    expect(ms).toBeLessThan(600);
  });

  it('exports 100k rows to CSV', () => {
    const body = rows.map((row) => [row.id, row.service, row.region, row.units]);
    let csv = '';
    const ms = time('toCsv x100k x4 cols', () => {
      csv = toCsv(['id', 'service', 'region', 'units'], body);
    });
    expect(csv.split('\r\n').length).toBe(COUNT + 1);
    expect(ms).toBeLessThan(2000);
  });

  it('hashes a large selection instead of scanning it', () => {
    // The shape `selectedIndex` and `toggleSelectAllOnPage` rely on: two
    // linear passes, never |selection| x |rows|.
    const selection = rows.slice(0, 50_000);
    let found = 0;
    const ms = time('Set-based selection lookup 50k in 100k', () => {
      const index = new Set(selection.map((row) => row.id));
      for (const row of rows) if (index.has(row.id)) found++;
    });
    expect(found).toBe(50_000);
    expect(ms).toBeLessThan(400);
  });
});
