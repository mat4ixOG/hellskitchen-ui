import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkColumn, HkEditEvent, HkTableComponent, HkTemplate } from 'hellskitchen-ui';

interface Deploy {
  id: number;
  service: string;
  region: string;
  owner: string;
  status: 'healthy' | 'degraded' | 'failed';
  units: number;
  revenue: { q1: number; q2: number };
  margin: number;
  updated: string;
  notes: string;
}

const REGIONS = ['Americas', 'EMEA', 'APAC'];
const OWNERS = ['Platform', 'Payments', 'Growth', 'Data'];
const STATUSES: Deploy['status'][] = ['healthy', 'degraded', 'failed'];
const SERVICES = [
  'auth-gateway', 'billing-api', 'search-index', 'media-pipe', 'notify-hub',
  'ledger-core', 'edge-cache', 'report-gen', 'session-store', 'webhook-relay'
];

/** Deterministic pseudo-random so the demo renders the same numbers every time. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function makeRows(count: number): Deploy[] {
  const random = seeded(20260827);
  return Array.from({ length: count }, (_, index) => {
    const q1 = Math.round(4000 + random() * 96000);
    const q2 = Math.round(q1 * (0.7 + random() * 0.8));
    return {
      id: index + 1,
      service: `${SERVICES[index % SERVICES.length]}-${String((index % 9) + 1).padStart(2, '0')}`,
      region: REGIONS[Math.floor(random() * REGIONS.length)],
      owner: OWNERS[Math.floor(random() * OWNERS.length)],
      status: STATUSES[random() < 0.68 ? 0 : random() < 0.6 ? 1 : 2],
      units: Math.round(2 + random() * 240),
      revenue: { q1, q2 },
      margin: Math.round((12 + random() * 46) * 10) / 10,
      updated: new Date(2026, Math.floor(random() * 8), 1 + Math.floor(random() * 27))
        .toISOString()
        .slice(0, 10),
      notes: 'Rolled out behind a flag; canary at 5% for 24h before the full ramp.'
    };
  });
}

/**
 * The live demo behind the docs page. Deliberately exercises the awkward
 * combinations — grouped headers over a frozen first column, a numeric
 * aggregate footer, editing, expansion and a 10k-row virtual mode — because
 * those are the ones a grid usually gets wrong.
 */
@Component({
  selector: 'app-table-demo',
  imports: [HkTableComponent, HkTemplate],
  templateUrl: './table-demo.component.html',
  styleUrl: './table-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDemoComponent {
  private readonly small = makeRows(180);
  /** Built on first use — no reason to make 10k objects nobody asked for. */
  private large: Deploy[] | null = null;

  readonly heavy = signal(false);
  readonly grouped = signal(false);
  readonly compact = signal(false);
  readonly selection = signal<Deploy[]>([]);
  readonly lastEdit = signal<string>('');

  readonly rows = computed(() => {
    if (!this.heavy()) return this.small;
    this.large ??= makeRows(10000);
    return this.large;
  });

  readonly columns: HkColumn<Deploy>[] = [
    {
      key: 'service',
      header: 'Service',
      sortable: true,
      filter: 'text',
      frozen: 'left',
      width: '11rem',
      truncate: 22,
      footer: 'Total'
    },
    { key: 'region', header: 'Region', sortable: true, filter: 'multiselect', width: '7.5rem' },
    { key: 'owner', header: 'Team', sortable: true, filter: 'select', width: '7rem' },
    { key: 'status', header: 'Status', sortable: true, filter: 'multiselect', width: '7.5rem', align: 'center' },
    {
      key: 'units',
      header: 'Units',
      sortable: true,
      filter: 'number',
      numeric: true,
      editable: true,
      aggregate: 'sum',
      width: '6rem'
    },
    {
      key: 'revenue',
      header: 'Revenue',
      children: [
        { key: 'q1', header: 'Q1', sortable: true, numeric: true, aggregate: 'sum', digits: 0, width: '7rem' },
        { key: 'q2', header: 'Q2', sortable: true, numeric: true, aggregate: 'sum', digits: 0, width: '7rem' }
      ]
    },
    {
      key: 'margin',
      header: 'Margin',
      sortable: true,
      filter: 'number',
      numeric: true,
      digits: 1,
      aggregate: 'avg',
      width: '6.5rem',
      format: (value) => `${value}%`
    },
    { key: 'updated', header: 'Updated', sortable: true, filter: 'date', width: '8rem' }
  ];

  toneOf(status: Deploy['status']): string {
    return status === 'healthy' ? 'is-ok' : status === 'degraded' ? 'is-warn' : 'is-bad';
  }

  onEdit(event: HkEditEvent<Deploy>): void {
    this.lastEdit.set(`${event.row.service}: ${event.column.header} ${event.oldValue} → ${event.value}`);
  }
}
