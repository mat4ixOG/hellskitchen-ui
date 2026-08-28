import { ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked } from '@angular/core';
import { HkBarChartComponent, HkLineChartComponent, HkSeries } from '@hellskitchen/ui';

type ChartId = 'line' | 'area' | 'bar' | 'stacked';

/** Deterministic, so the demo renders the same numbers every visit. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

function build(count: number, base: number, spread: number, seed: number): HkSeries['data'] {
  const random = seeded(seed);
  let value = base;
  return MONTHS.slice(0, count).map((month) => {
    value = Math.max(0, value + (random() - 0.45) * spread);
    return { x: month, y: Math.round(value) };
  });
}

@Component({
  selector: 'app-charts-demo',
  imports: [HkLineChartComponent, HkBarChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './charts-demo.component.html',
  styleUrl: './charts-demo.component.css'
})
export class ChartsDemoComponent {
  readonly slug = input('');

  readonly kinds: { id: ChartId; label: string }[] = [
    { id: 'line', label: 'Line' },
    { id: 'area', label: 'Area' },
    { id: 'bar', label: 'Bar' },
    { id: 'stacked', label: 'Stacked' }
  ];

  readonly kind = signal<ChartId>('line');
  readonly seriesCount = signal(3);
  readonly smooth = signal(false);

  private readonly pool: HkSeries[] = [
    { id: 'api', label: 'billing-api', data: build(8, 120, 60, 11) },
    { id: 'auth', label: 'auth-gateway', data: build(8, 90, 45, 29) },
    { id: 'edge', label: 'edge-cache', data: build(8, 60, 30, 47) },
    { id: 'search', label: 'search-index', data: build(8, 40, 24, 83) },
    { id: 'media', label: 'media-pipe', data: build(8, 30, 18, 97) }
  ];

  readonly series = computed<HkSeries[]>(() => {
    const wantsArea = this.kind() === 'area';
    return this.pool
      .slice(0, this.seriesCount())
      .map((s) => ({ ...s, area: wantsArea }));
  });

  /** A gap the line must break at rather than draw through. */
  readonly gapped = computed<HkSeries[]>(() =>
    this.series().map((s, i) =>
      i === 0
        ? { ...s, data: s.data.map((p, index) => (index === 4 ? { ...p, y: null } : p)) }
        : s
    )
  );

  private static readonly BY_SLUG: Record<string, ChartId> = {
    'line-chart': 'line',
    'area-chart': 'area',
    'bar-chart': 'bar'
  };

  constructor() {
    effect(() => {
      const match = ChartsDemoComponent.BY_SLUG[this.slug()];
      if (match) untracked(() => this.kind.set(match));
    });
  }
}
