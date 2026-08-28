/**
 * The maths a chart library actually needs: scales, human tick steps and path
 * builders. Kept free of Angular so it can be unit tested directly.
 *
 * This is the part people assume requires d3. It does not — d3's chart core is
 * scales plus path generators, which is what follows.
 */
import { HkPoint, HkSeries, HkTick } from './chart.types';

// ── Scales ─────────────────────────────────────────────────────

/** Maps a value in [d0, d1] onto pixels in [r0, r1]. */
export function linearScale(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0;
  // A flat series has no span; pin it to the middle rather than dividing by zero.
  if (span === 0) return () => (r0 + r1) / 2;
  const ratio = (r1 - r0) / span;
  return (v: number) => r0 + (v - d0) * ratio;
}

/** Evenly spaced band centres, for categorical axes. */
export function bandScale(count: number, r0: number, r1: number): (i: number) => number {
  if (count <= 0) return () => r0;
  const step = (r1 - r0) / count;
  return (i: number) => r0 + step * i + step / 2;
}

export function bandWidth(count: number, r0: number, r1: number): number {
  return count <= 0 ? 0 : (r1 - r0) / count;
}

// ── Ticks ──────────────────────────────────────────────────────

/**
 * Rounds a raw step up to the next 1, 2, 5 or 10 × 10ⁿ.
 *
 * This is why axes read 0 / 1,000 / 2,000 instead of 0 / 1,133 / 2,266 — the
 * single thing that most separates a hand-rolled chart from a real one.
 */
export function niceStep(rough: number): number {
  if (rough <= 0 || !Number.isFinite(rough)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalised = rough / magnitude;
  const snapped = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return snapped * magnitude;
}

/**
 * A domain extended outward to land on clean numbers, plus its ticks.
 * Always includes zero for bar charts — a truncated bar axis misleads.
 */
export function niceDomain(
  min: number,
  max: number,
  count = 5,
  includeZero = false
): { min: number; max: number; step: number } {
  let lo = includeZero ? Math.min(0, min) : min;
  let hi = includeZero ? Math.max(0, max) : max;

  if (lo === hi) {
    // A single flat value still needs a readable band around it.
    const pad = Math.abs(lo) || 1;
    lo -= pad;
    hi += pad;
  }

  const step = niceStep((hi - lo) / Math.max(1, count));
  return {
    min: Math.floor(lo / step) * step,
    max: Math.ceil(hi / step) * step,
    step
  };
}

export function buildTicks(
  min: number,
  max: number,
  step: number,
  scale: (v: number) => number,
  format: (v: number) => string
): HkTick[] {
  const ticks: HkTick[] = [];
  // Floating-point accumulation drifts; derive each tick from its index.
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    const value = min + i * step;
    ticks.push({ value, position: scale(value), label: format(value) });
  }
  return ticks;
}

// ── Formatting ─────────────────────────────────────────────────

const compactFormatters = new Map<string, Intl.NumberFormat>();

/** Thousands-separated, and compacted past 10k so axis labels stay short. */
export function formatValue(value: number, locale = 'en-US', digits?: number): string {
  if (!Number.isFinite(value)) return '—';
  const key = `${locale}|${digits ?? ''}|${Math.abs(value) >= 10000}`;
  let formatter = compactFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
      maximumFractionDigits: digits ?? (Math.abs(value) >= 10000 ? 1 : 2)
    });
    compactFormatters.set(key, formatter);
  }
  return formatter.format(value);
}

export function labelOf(x: HkPoint['x']): string {
  if (x instanceof Date) return x.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return String(x);
}

// ── Paths ──────────────────────────────────────────────────────

/**
 * A polyline through the points, breaking at nulls.
 *
 * Breaking matters: joining across a gap draws a straight line through missing
 * data and reads as measured, which is a lie.
 */
export function linePath(
  points: { x: number; y: number | null }[]
): string {
  let path = '';
  let open = false;
  for (const p of points) {
    if (p.y === null) {
      open = false;
      continue;
    }
    path += `${open ? 'L' : 'M'}${round(p.x)},${round(p.y)}`;
    open = true;
  }
  return path;
}

/** A Catmull-Rom → cubic Bézier smoothing, for `curve="smooth"`. */
export function smoothPath(points: { x: number; y: number | null }[]): string {
  const runs = splitRuns(points);
  let path = '';
  for (const run of runs) {
    if (run.length === 1) {
      path += `M${round(run[0].x)},${round(run[0].y)}`;
      continue;
    }
    path += `M${round(run[0].x)},${round(run[0].y)}`;
    for (let i = 0; i < run.length - 1; i++) {
      const p0 = run[i - 1] ?? run[i];
      const p1 = run[i];
      const p2 = run[i + 1];
      const p3 = run[i + 2] ?? p2;
      // Tension 6 is the standard Catmull-Rom→Bézier conversion; it keeps the
      // curve passing through every point rather than merely near them.
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      path += `C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p2.x)},${round(p2.y)}`;
    }
  }
  return path;
}

/** Closes a line down to the baseline, for the area wash. */
export function areaPath(
  points: { x: number; y: number | null }[],
  baseline: number,
  smooth = false
): string {
  const runs = splitRuns(points);
  let path = '';
  for (const run of runs) {
    const line = smooth ? smoothPath(run) : linePath(run);
    if (!line) continue;
    path += `${line}L${round(run[run.length - 1].x)},${round(baseline)}L${round(run[0].x)},${round(baseline)}Z`;
  }
  return path;
}

/**
 * A rect with only its data-end rounded — square at the baseline.
 * A bar rounded at both ends detaches visually from its axis.
 */
export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  orientation: 'vertical' | 'horizontal',
  negative = false
): string {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (r === 0 || height <= 0 || width <= 0) {
    return `M${round(x)},${round(y)}h${round(width)}v${round(height)}h${round(-width)}Z`;
  }

  if (orientation === 'vertical') {
    return negative
      ? `M${round(x)},${round(y)}h${round(width)}v${round(height - r)}a${r},${r} 0 0 1 ${-r},${r}h${round(-(width - 2 * r))}a${r},${r} 0 0 1 ${-r},${-r}Z`
      : `M${round(x)},${round(y + r)}a${r},${r} 0 0 1 ${r},${-r}h${round(width - 2 * r)}a${r},${r} 0 0 1 ${r},${r}v${round(height - r)}h${round(-width)}Z`;
  }

  return negative
    ? `M${round(x + width)},${round(y)}h${round(-(width - r))}a${r},${r} 0 0 0 ${-r},${r}v${round(height - 2 * r)}a${r},${r} 0 0 0 ${r},${r}h${round(width - r)}Z`
    : `M${round(x)},${round(y)}h${round(width - r)}a${r},${r} 0 0 1 ${r},${r}v${round(height - 2 * r)}a${r},${r} 0 0 1 ${-r},${r}h${round(-(width - r))}Z`;
}

/** Donut/pie arc between two angles, in radians from 12 o'clock. */
export function arcPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number
): string {
  // A full circle cannot be expressed as one arc — nudge it just short.
  const sweep = Math.min(end - start, Math.PI * 2 - 0.0001);
  const a0 = start - Math.PI / 2;
  const a1 = a0 + sweep;
  const large = sweep > Math.PI ? 1 : 0;

  const x0 = cx + outer * Math.cos(a0);
  const y0 = cy + outer * Math.sin(a0);
  const x1 = cx + outer * Math.cos(a1);
  const y1 = cy + outer * Math.sin(a1);

  if (inner <= 0) {
    return `M${round(cx)},${round(cy)}L${round(x0)},${round(y0)}A${round(outer)},${round(outer)} 0 ${large} 1 ${round(x1)},${round(y1)}Z`;
  }

  const ix1 = cx + inner * Math.cos(a1);
  const iy1 = cy + inner * Math.sin(a1);
  const ix0 = cx + inner * Math.cos(a0);
  const iy0 = cy + inner * Math.sin(a0);

  return (
    `M${round(x0)},${round(y0)}` +
    `A${round(outer)},${round(outer)} 0 ${large} 1 ${round(x1)},${round(y1)}` +
    `L${round(ix1)},${round(iy1)}` +
    `A${round(inner)},${round(inner)} 0 ${large} 0 ${round(ix0)},${round(iy0)}Z`
  );
}

/** Two decimals is below a device pixel and keeps the DOM small. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function splitRuns(
  points: { x: number; y: number | null }[]
): { x: number; y: number }[][] {
  const runs: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  for (const p of points) {
    if (p.y === null) {
      if (current.length) runs.push(current);
      current = [];
    } else {
      current.push({ x: p.x, y: p.y });
    }
  }
  if (current.length) runs.push(current);
  return runs;
}

// ── Series helpers ─────────────────────────────────────────────

/** Min and max across every series, ignoring nulls. */
export function extent(series: HkSeries[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    for (const p of s.data) {
      if (p.y === null || !Number.isFinite(p.y)) continue;
      if (p.y < min) min = p.y;
      if (p.y > max) max = p.y;
    }
  }
  return Number.isFinite(min) ? { min, max } : { min: 0, max: 1 };
}

/** Per-index totals, for a stacked chart's domain. */
export function stackedExtent(series: HkSeries[]): { min: number; max: number } {
  const length = Math.max(0, ...series.map((s) => s.data.length));
  let max = 0;
  let min = 0;
  for (let i = 0; i < length; i++) {
    let positive = 0;
    let negative = 0;
    for (const s of series) {
      const value = s.data[i]?.y;
      if (value === null || value === undefined || !Number.isFinite(value)) continue;
      if (value >= 0) positive += value;
      else negative += value;
    }
    if (positive > max) max = positive;
    if (negative < min) min = negative;
  }
  return { min, max };
}

/** Category labels, taken from the longest series. */
export function categories(series: HkSeries[]): string[] {
  const longest = series.reduce<HkSeries | null>(
    (best, s) => (!best || s.data.length > best.data.length ? s : best),
    null
  );
  return (longest?.data ?? []).map((p) => labelOf(p.x));
}
