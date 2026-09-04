import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HkChartBase } from './chart-base';
import {
  HkChartMargin,
  HkChartPointEvent,
  HkTooltipRow
} from './chart.types';
import {
  areaPath,
  bandScale,
  buildTicks,
  categories,
  extent,
  formatValue,
  labelOf,
  linePath,
  linearScale,
  niceDomain,
  smoothPath
} from './chart.utils';

/**
 * Line and area chart.
 *
 * Ships a crosshair and tooltip by default — an SVG chart in a browser *is*
 * interactive, and hiding the values behind nothing is a waste of the medium.
 * Gaps in the data break the line rather than being drawn through, because a
 * straight segment across missing points reads as measured.
 */
@Component({
  selector: 'hk-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-line-chart.component.html',
  styleUrl: './chart.css'
})
export class HkLineChartComponent extends HkChartBase {
  readonly curve = input<'linear' | 'smooth'>('linear');
  /** Marks every point. Off by default — dots on a dense line are noise. */
  readonly markers = input(false);
  /** Labels the last point of each series. Selective by design. */
  readonly endLabels = input(true);

  readonly pointActivate = output<HkChartPointEvent>();

  readonly hoverIndex = signal<number | null>(null);

  protected margin(): HkChartMargin {
    return { top: 16, right: this.endLabels() ? 52 : 16, bottom: 28, left: 48 };
  }

  readonly labels = computed(() => categories(this.resolved()));

  readonly domain = computed(() => {
    const { min, max } = extent(this.resolved());
    const config = this.yAxis();
    const nice = niceDomain(min, max, config.ticks ?? 5, min >= 0);
    return {
      min: config.min ?? nice.min,
      max: config.max ?? nice.max,
      step: nice.step
    };
  });

  readonly yScale = computed(() => {
    const plot = this.plot();
    const d = this.domain();
    return linearScale(d.min, d.max, plot.top + plot.height, plot.top);
  });

  readonly xScale = computed(() => {
    const plot = this.plot();
    return bandScale(this.labels().length, plot.left, plot.left + plot.width);
  });

  readonly yTicks = computed(() => {
    const d = this.domain();
    return buildTicks(d.min, d.max, d.step, this.yScale(), this.format());
  });

  /** Thinned so labels never collide on a narrow chart. */
  readonly xTicks = computed(() => {
    const labels = this.labels();
    const scale = this.xScale();
    const maxLabels = Math.max(2, Math.floor(this.plot().width / 64));
    const stride = Math.ceil(labels.length / maxLabels);
    return labels
      .map((label, index) => ({ label, index, position: scale(index) }))
      .filter((_, index) => index % stride === 0);
  });

  readonly paths = computed(() => {
    const xScale = this.xScale();
    const yScale = this.yScale();
    const smooth = this.curve() === 'smooth';
    const baseline = yScale(Math.max(0, this.domain().min));

    return this.resolved().map((s) => {
      const points = s.data.map((p, i) => ({
        x: xScale(i),
        y: p.y === null || p.y === undefined ? null : yScale(p.y)
      }));
      return {
        id: s.id,
        label: s.label,
        color: s.color!,
        dashed: !!s.dashed,
        line: smooth ? smoothPath(points) : linePath(points),
        area: s.area ? areaPath(points, baseline, smooth) : '',
        points: points.map((p, i) => ({ ...p, value: s.data[i]?.y ?? null })),
        last: [...points].reverse().find((p) => p.y !== null) ?? null,
        lastValue: [...s.data].reverse().find((p) => p.y !== null)?.y ?? null
      };
    });
  });

  readonly crosshairX = computed(() => {
    const index = this.hoverIndex();
    return index === null ? null : this.xScale()(index);
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

  /** Keeps the tooltip inside the chart rather than clipped at the edge. */
  readonly tooltipLeft = computed(() => {
    const x = this.crosshairX();
    if (x === null) return 0;
    return Math.min(Math.max(x + 12, 8), Math.max(8, this.width() - 172));
  });

  /** Nearest index to the pointer — the whole plot is one hit target. */
  onMove(event: PointerEvent): void {
    const plot = this.plot();
    const count = this.labels().length;
    if (!count || plot.width <= 0) return;
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const x = event.clientX - rect.left - plot.left;
    const step = plot.width / count;
    const index = Math.round((x - step / 2) / step);
    this.hoverIndex.set(Math.min(count - 1, Math.max(0, index)));
  }

  onLeave(): void {
    this.hoverIndex.set(null);
  }

  /** Arrow keys walk the series for keyboard users. */
  onKeydown(event: KeyboardEvent): void {
    const count = this.labels().length;
    if (!count) return;
    const current = this.hoverIndex() ?? 0;
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = Math.min(count - 1, current + 1);
    if (event.key === 'ArrowLeft') next = Math.max(0, current - 1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = count - 1;
    if (event.key === 'Escape') {
      this.hoverIndex.set(null);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    this.hoverIndex.set(next);
  }

  /** The hovered point of a series, or null when that series is shorter. */
  hoveredPoint(points: { x: number; y: number | null }[]): { x: number; y: number } | null {
    const index = this.hoverIndex();
    if (index === null) return null;
    const point = points[index] as { x: number; y: number | null } | undefined;
    return point && point.y !== null ? { x: point.x, y: point.y } : null;
  }

  activate(seriesId: string, index: number): void {
    const s = this.resolved().find((item) => item.id === seriesId);
    if (s?.data[index]) this.pointActivate.emit({ seriesId, index, point: s.data[index] });
  }

  formatCell(value: number | null): string {
    return value === null ? '—' : this.format()(value);
  }

  labelAt(index: number): string {
    return this.labels()[index] ?? '';
  }

  compactValue(value: number | null): string {
    return value === null ? '' : formatValue(value, this.locale());
  }

  pointLabel(x: unknown): string {
    return labelOf(x as never);
  }
}
