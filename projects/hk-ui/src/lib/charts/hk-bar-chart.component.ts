import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HkChartBase } from './chart-base';
import {
  HkBarLayout,
  HkBarOrientation,
  HkChartMargin,
  HkChartPointEvent,
  HkTooltipRow
} from './chart.types';
import {
  bandWidth,
  barPath,
  buildTicks,
  categories,
  extent,
  linearScale,
  niceDomain,
  stackedExtent
} from './chart.utils';

/** One rendered bar, already positioned. */
interface Bar {
  seriesId: string;
  label: string;
  color: string;
  index: number;
  path: string;
  value: number;
  /** Label anchor at the data-end. */
  labelX: number;
  labelY: number;
}

/**
 * Grouped or stacked bars, vertical or horizontal.
 *
 * Three details do most of the work: bars are capped at 24px so the band keeps
 * some air, only the data-end is rounded (a bar rounded at the baseline floats
 * off its axis), and touching marks are separated by a 2px gap in the surface
 * colour rather than by a stroke — a stroke adds ink that is not data.
 *
 * The value axis always includes zero. A truncated bar axis exaggerates
 * differences and is the most common way a bar chart misleads.
 */
@Component({
  selector: 'hk-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-bar-chart.component.html',
  styleUrl: './chart.css'
})
export class HkBarChartComponent extends HkChartBase {
  readonly layout = input<HkBarLayout>('grouped');
  readonly orientation = input<HkBarOrientation>('vertical');
  /** Value at the data-end. Skipped automatically when it will not fit. */
  readonly valueLabels = input(false);

  readonly barActivate = output<HkChartPointEvent>();

  readonly hoverIndex = signal<number | null>(null);

  /** Fixed specs from the mark table — not tuning knobs. */
  private static readonly MAX_THICKNESS = 24;
  private static readonly RADIUS = 4;
  private static readonly GAP = 2;

  protected margin(): HkChartMargin {
    return this.orientation() === 'vertical'
      ? { top: 16, right: 16, bottom: 30, left: 48 }
      : { top: 16, right: 32, bottom: 26, left: 92 };
  }

  readonly labels = computed(() => categories(this.resolved()));

  readonly domain = computed(() => {
    const series = this.resolved();
    const { min, max } = this.layout() === 'stacked' ? stackedExtent(series) : extent(series);
    const config = this.yAxis();
    // includeZero is not optional for bars.
    const nice = niceDomain(min, max, config.ticks ?? 5, true);
    return { min: config.min ?? nice.min, max: config.max ?? nice.max, step: nice.step };
  });

  /** Pixels along the value axis. */
  readonly valueScale = computed(() => {
    const plot = this.plot();
    const d = this.domain();
    return this.orientation() === 'vertical'
      ? linearScale(d.min, d.max, plot.top + plot.height, plot.top)
      : linearScale(d.min, d.max, plot.left, plot.left + plot.width);
  });

  readonly valueTicks = computed(() => {
    const d = this.domain();
    return buildTicks(d.min, d.max, d.step, this.valueScale(), this.format());
  });

  private readonly band = computed(() => {
    const plot = this.plot();
    return this.orientation() === 'vertical'
      ? bandWidth(this.labels().length, plot.left, plot.left + plot.width)
      : bandWidth(this.labels().length, plot.top, plot.top + plot.height);
  });

  /** Category tick centres. */
  readonly categoryTicks = computed(() => {
    const plot = this.plot();
    const band = this.band();
    const start = this.orientation() === 'vertical' ? plot.left : plot.top;
    return this.labels().map((label, index) => ({
      label,
      index,
      position: start + band * index + band / 2
    }));
  });

  readonly bars = computed<Bar[]>(() => {
    const series = this.resolved();
    const labels = this.labels();
    const plot = this.plot();
    const scale = this.valueScale();
    const band = this.band();
    const vertical = this.orientation() === 'vertical';
    const stacked = this.layout() === 'stacked';
    const zero = scale(Math.max(0, this.domain().min));
    const gap = HkBarChartComponent.GAP;

    // Bars never fill their slot: cap the thickness and let the remainder be air.
    const slot = stacked ? band * 0.68 : (band * 0.72) / Math.max(1, series.length);
    const thickness = Math.max(1, Math.min(HkBarChartComponent.MAX_THICKNESS, slot - gap));
    const groupWidth = stacked ? thickness : thickness * series.length + gap * (series.length - 1);

    const out: Bar[] = [];

    for (let index = 0; index < labels.length; index++) {
      const centre = (vertical ? plot.left : plot.top) + band * index + band / 2;
      let positiveEnd = zero;
      let negativeEnd = zero;

      series.forEach((s, si) => {
        const raw = s.data[index]?.y;
        if (raw === null || raw === undefined || !Number.isFinite(raw)) return;

        const start = stacked
          ? centre - groupWidth / 2
          : centre - groupWidth / 2 + si * (thickness + gap);

        const negative = raw < 0;
        let from: number;
        let to: number;

        if (stacked) {
          const base = negative ? negativeEnd : positiveEnd;
          const next = scale(
            (scaleInverse(scale, base) ?? 0) + raw
          );
          from = base;
          to = next;
          if (negative) negativeEnd = next;
          else positiveEnd = next;
        } else {
          from = zero;
          to = scale(raw);
        }

        // Stacked segments are separated by the same 2px gap as adjacent bars.
        const trim = stacked && Math.abs(to - from) > gap * 2 ? gap : 0;

        let path: string;
        let labelX: number;
        let labelY: number;

        if (vertical) {
          const top = Math.min(from, to) + (negative ? trim : 0);
          const height = Math.abs(to - from) - trim;
          path = barPath(start, top, thickness, height, HkBarChartComponent.RADIUS, 'vertical', negative);
          labelX = start + thickness / 2;
          labelY = negative ? top + height + 12 : top - 6;
        } else {
          const left = Math.min(from, to) + (negative ? 0 : 0);
          const width = Math.abs(to - from) - trim;
          path = barPath(left, start, width, thickness, HkBarChartComponent.RADIUS, 'horizontal', negative);
          labelX = negative ? left - 6 : left + width + 6;
          labelY = start + thickness / 2;
        }

        out.push({
          seriesId: s.id,
          label: s.label,
          color: s.color!,
          index,
          path,
          value: raw,
          labelX,
          labelY
        });
      });
    }
    return out;
  });

  readonly tooltipRows = computed<HkTooltipRow[]>(() => {
    const index = this.hoverIndex();
    if (index === null) return [];
    const format = this.format();
    return this.resolved().map((s) => {
      const value = s.data[index]?.y ?? null;
      return {
        id: s.id,
        label: s.label,
        color: s.color!,
        value,
        formatted: value === null ? '—' : format(value)
      };
    });
  });

  readonly tooltipTitle = computed(() => {
    const index = this.hoverIndex();
    return index === null ? '' : this.labels()[index] ?? '';
  });

  readonly hoverBandRects = computed(() => {
    const plot = this.plot();
    const band = this.band();
    const vertical = this.orientation() === 'vertical';
    return this.labels().map((_, index) => ({
      index,
      x: vertical ? plot.left + band * index : plot.left,
      y: vertical ? plot.top : plot.top + band * index,
      width: vertical ? band : plot.width,
      height: vertical ? plot.height : band
    }));
  });

  readonly tooltipLeft = computed(() => {
    const index = this.hoverIndex();
    if (index === null) return 0;
    const band = this.band();
    const plot = this.plot();
    const x = this.orientation() === 'vertical' ? plot.left + band * index + band / 2 : plot.left + plot.width / 2;
    return Math.min(Math.max(x + 10, 8), Math.max(8, this.width() - 172));
  });

  onEnter(index: number): void {
    this.hoverIndex.set(index);
  }

  onLeave(): void {
    this.hoverIndex.set(null);
  }

  activate(bar: Bar): void {
    const s = this.resolved().find((item) => item.id === bar.seriesId);
    if (s?.data[bar.index]) {
      this.barActivate.emit({ seriesId: bar.seriesId, index: bar.index, point: s.data[bar.index] });
    }
  }

  formatCell(value: number | null): string {
    return value === null ? '—' : this.format()(value);
  }

  /** Only label when the text has room — a clipped label is worse than none. */
  showValueLabel(bar: Bar): boolean {
    if (!this.valueLabels()) return false;
    if (this.layout() === 'stacked') return false;
    return true;
  }
}

/**
 * Recovers a domain value from a pixel position. Stacking needs to add in data
 * space, not pixel space, or unequal steps accumulate error.
 */
function scaleInverse(scale: (v: number) => number, pixel: number): number | null {
  const a = scale(0);
  const b = scale(1);
  if (a === b) return null;
  return (pixel - a) / (b - a);
}
