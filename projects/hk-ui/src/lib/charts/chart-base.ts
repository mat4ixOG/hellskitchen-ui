import {
  DestroyRef,
  Directive,
  ElementRef,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { HkAxisConfig, HkChartMargin, HkPlotArea, HkSeries } from './chart.types';
import { HK_MAX_SERIES, seriesColor } from './chart-palette';
import { formatValue } from './chart.utils';

/**
 * Shared plumbing for every chart: responsive sizing, the plot rectangle after
 * margins, palette assignment, and the table view.
 *
 * Colour is assigned from the series' *position in the input array*, so it
 * follows the entity rather than its current rank — filtering a series out
 * must not repaint the survivors.
 */
@Directive()
export abstract class HkChartBase {
  readonly series = input<HkSeries[]>([]);
  readonly title = input('');
  readonly subtitle = input('');
  /** Height in px. Width always fills the container. */
  readonly height = input(260);
  readonly xAxis = input<HkAxisConfig>({});
  readonly yAxis = input<HkAxisConfig>({});
  readonly locale = input('en-US');
  /** Shows the "Table" toggle. Required relief when hues are low-contrast. */
  readonly tableView = input(true);
  readonly legend = input(true);
  readonly loading = input(false);
  readonly emptyMessage = input('No data');

  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly destroyRef = inject(DestroyRef);

  readonly width = signal(560);
  readonly showTable = signal(false);
  /** Set from the theme so the palette steps for the right surface. */
  readonly isDark = signal(false);

  protected abstract margin(): HkChartMargin;

  readonly plot = computed<HkPlotArea>(() => {
    const m = this.margin();
    return {
      left: m.left,
      top: m.top,
      width: Math.max(0, this.width() - m.left - m.right),
      height: Math.max(0, this.height() - m.top - m.bottom)
    };
  });

  /**
   * Series past the eighth are folded into a single "Other" bucket rather than
   * given a generated hue — a ninth generated colour is indistinguishable from
   * an existing slot under colour-vision deficiency.
   */
  readonly resolved = computed(() => {
    const all = this.series() ?? [];
    const dark = this.isDark();
    const head = all.slice(0, HK_MAX_SERIES);
    const tail = all.slice(HK_MAX_SERIES);

    const out = head.map((s, i) => ({
      ...s,
      color: s.color ?? seriesColor(i, dark)
    }));

    if (tail.length) {
      const length = Math.max(...tail.map((s) => s.data.length));
      /**
       * x comes from whichever series actually has a point at this index.
       * Reading it off `tail[0]` alone breaks as soon as that series is the
       * shortest — the bucket then falls back to the bare index and mixes raw
       * numbers into what may well be a categorical axis.
       */
      const xAt = (index: number): HkSeries['data'][number]['x'] => {
        for (const candidate of all) {
          const point = candidate.data[index];
          if (point) return point.x;
        }
        return index;
      };
      const merged = Array.from({ length }, (_, index) => ({
        x: xAt(index),
        y: tail.reduce((sum, s) => {
          const value = s.data[index]?.y;
          return value === null || value === undefined ? sum : sum + value;
        }, 0)
      }));
      out.push({
        id: '__other',
        label: `Other (${tail.length})`,
        data: merged,
        color: seriesColor(HK_MAX_SERIES, dark)
      });
    }
    return out;
  });

  readonly hasData = computed(() =>
    this.resolved().some((s) => s.data.some((p) => p.y !== null && p.y !== undefined))
  );

  /** A single series needs no legend — the title already names it. */
  readonly showLegend = computed(() => this.legend() && this.resolved().length >= 2);

  readonly format = computed(() => {
    const custom = this.yAxis().format;
    const locale = this.locale();
    return (value: number) => (custom ? custom(value) : formatValue(value, locale));
  });

  constructor() {
    this.observeWidth();
    this.observeTheme();
  }

  private observeWidth(): void {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      // Sub-pixel jitter would re-render the whole chart on every scroll.
      if (next > 0 && Math.abs(next - this.width()) > 1) this.width.set(next);
    });
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  /** Palette steps differ per surface, so the chart tracks the theme class. */
  private observeTheme(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const read = () => this.isDark.set(root.classList.contains('dark'));
    read();
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  toggleTable(): void {
    this.showTable.set(!this.showTable());
  }

  /**
   * Value at an index, or null. Series need not be the same length — a shorter
   * one simply has no cell there, which the table renders as a dash.
   */
  cellValue(series: HkSeries, index: number): number | null {
    const point = series.data[index] as HkSeries['data'][number] | undefined;
    return point?.y ?? null;
  }
}
