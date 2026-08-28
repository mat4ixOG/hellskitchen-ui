import {
  arcPath,
  areaPath,
  bandScale,
  barPath,
  buildTicks,
  categories,
  extent,
  formatValue,
  linePath,
  linearScale,
  niceDomain,
  niceStep,
  stackedExtent
} from './chart.utils';
import { HK_MAX_SERIES, HK_SERIES_LIGHT, seriesColor } from './chart-palette';
import { HkSeries } from './chart.types';

describe('chart maths', () => {
  describe('linearScale', () => {
    it('maps the domain onto the range', () => {
      const scale = linearScale(0, 100, 0, 200);
      expect(scale(0)).toBe(0);
      expect(scale(50)).toBe(100);
      expect(scale(100)).toBe(200);
    });

    it('inverts when the range is inverted, as a y-axis is', () => {
      const scale = linearScale(0, 10, 300, 0);
      expect(scale(0)).toBe(300);
      expect(scale(10)).toBe(0);
    });

    it('pins a flat domain to the middle rather than dividing by zero', () => {
      const scale = linearScale(5, 5, 0, 100);
      expect(scale(5)).toBe(50);
      expect(Number.isFinite(scale(5))).toBeTrue();
    });
  });

  describe('niceStep', () => {
    it('snaps to 1, 2, 5 or 10 times a power of ten', () => {
      expect(niceStep(1)).toBe(1);
      expect(niceStep(1.5)).toBe(2);
      expect(niceStep(3)).toBe(5);
      expect(niceStep(7)).toBe(10);
      expect(niceStep(1133)).toBe(2000);
    });

    it('never returns zero or a negative for degenerate input', () => {
      expect(niceStep(0)).toBe(1);
      expect(niceStep(-5)).toBe(1);
      expect(niceStep(NaN)).toBe(1);
    });
  });

  describe('niceDomain', () => {
    it('produces human bounds, not raw data bounds', () => {
      const d = niceDomain(3, 97, 5);
      expect(d.min % d.step).toBe(0);
      expect(d.min).toBeLessThanOrEqual(3);
      expect(d.max).toBeGreaterThanOrEqual(97);
    });

    it('includes zero when asked — a truncated bar axis misleads', () => {
      const d = niceDomain(40, 60, 5, true);
      expect(d.min).toBe(0);
    });

    it('gives a flat series a readable band instead of a zero-height plot', () => {
      const d = niceDomain(7, 7, 5);
      expect(d.max).toBeGreaterThan(d.min);
    });
  });

  describe('buildTicks', () => {
    it('lands on exact values without floating-point drift', () => {
      const scale = linearScale(0, 1, 0, 100);
      const ticks = buildTicks(0, 1, 0.1, scale, (v) => v.toFixed(1));
      expect(ticks.length).toBe(11);
      // Accumulating 0.1 eleven times would drift; deriving from the index does not.
      expect(ticks[10].value).toBe(1);
      expect(ticks[3].value).toBeCloseTo(0.3, 10);
    });
  });

  describe('linePath', () => {
    it('breaks at nulls instead of drawing through missing data', () => {
      const path = linePath([
        { x: 0, y: 0 },
        { x: 1, y: 10 },
        { x: 2, y: null },
        { x: 3, y: 30 }
      ]);
      // Two move commands means two runs — the gap is preserved.
      expect((path.match(/M/g) ?? []).length).toBe(2);
    });

    it('returns empty for an all-null series', () => {
      expect(linePath([{ x: 0, y: null }])).toBe('');
    });
  });

  describe('areaPath', () => {
    it('closes each run down to the baseline', () => {
      const path = areaPath([{ x: 0, y: 10 }, { x: 10, y: 20 }], 100);
      expect(path.endsWith('Z')).toBeTrue();
      expect(path).toContain('100');
    });
  });

  describe('barPath', () => {
    it('rounds only the data-end, leaving the baseline square', () => {
      const path = barPath(0, 0, 20, 100, 4, 'vertical');
      // Exactly two arcs — the two corners at the top.
      expect((path.match(/a/g) ?? []).length).toBe(2);
    });

    it('clamps the radius so a short bar does not invert', () => {
      const path = barPath(0, 0, 20, 2, 4, 'vertical');
      expect(path).toContain('M');
      expect(path).not.toContain('NaN');
    });

    it('produces no NaN for a zero-height bar', () => {
      expect(barPath(0, 0, 20, 0, 4, 'vertical')).not.toContain('NaN');
    });
  });

  describe('arcPath', () => {
    it('stays just short of a full turn, which one arc cannot express', () => {
      const path = arcPath(50, 50, 40, 20, 0, Math.PI * 2);
      expect(path).not.toContain('NaN');
      expect(path).toContain('A');
    });
  });

  describe('extents', () => {
    const series: HkSeries[] = [
      { id: 'a', label: 'A', data: [{ x: 0, y: 10 }, { x: 1, y: null }, { x: 2, y: 30 }] },
      { id: 'b', label: 'B', data: [{ x: 0, y: 5 }, { x: 1, y: 50 }, { x: 2, y: 15 }] }
    ];

    it('ignores nulls', () => {
      expect(extent(series)).toEqual({ min: 5, max: 50 });
    });

    it('sums per index when stacked, skipping nulls', () => {
      // Index 0: 10+5=15. Index 1: null+50=50. Index 2: 30+15=45.
      // The stacked domain must reach the tallest *stack*, not the tallest bar.
      expect(stackedExtent(series).max).toBe(50);
      expect(extent(series).max).toBe(50);
    });

    it('reaches higher than any single value when stacks add up', () => {
      const additive: HkSeries[] = [
        { id: 'a', label: 'A', data: [{ x: 0, y: 30 }] },
        { id: 'b', label: 'B', data: [{ x: 0, y: 40 }] }
      ];
      expect(extent(additive).max).toBe(40);
      expect(stackedExtent(additive).max).toBe(70);
    });

    it('tracks negative stacks separately from positive ones', () => {
      const mixed: HkSeries[] = [
        { id: 'a', label: 'A', data: [{ x: 0, y: -20 }] },
        { id: 'b', label: 'B', data: [{ x: 0, y: -15 }] }
      ];
      expect(stackedExtent(mixed).min).toBe(-35);
    });

    it('falls back to a usable domain with no data', () => {
      expect(extent([])).toEqual({ min: 0, max: 1 });
    });

    it('takes categories from the longest series', () => {
      expect(categories(series).length).toBe(3);
    });
  });

  describe('formatValue', () => {
    it('groups thousands and compacts past 10k so labels stay short', () => {
      expect(formatValue(1234)).toBe('1,234');
      expect(formatValue(1250000)).toMatch(/1\.3M|1\.2M/);
    });

    it('renders a dash rather than NaN', () => {
      expect(formatValue(NaN)).toBe('—');
    });
  });

  describe('palette', () => {
    it('never cycles past the last slot — a generated 9th hue is unsafe', () => {
      const ninth = seriesColor(HK_MAX_SERIES);
      expect(HK_SERIES_LIGHT).not.toContain(ninth as never);
    });

    it('assigns colour by slot, so filtering cannot repaint survivors', () => {
      expect(seriesColor(0)).toBe(HK_SERIES_LIGHT[0]);
      expect(seriesColor(2)).toBe(HK_SERIES_LIGHT[2]);
    });

    it('steps a different set for the dark surface', () => {
      expect(seriesColor(1, true)).not.toBe(seriesColor(1, false));
    });
  });

  describe('bandScale', () => {
    it('centres each band', () => {
      const scale = bandScale(4, 0, 400);
      expect(scale(0)).toBe(50);
      expect(scale(3)).toBe(350);
    });
  });
});
