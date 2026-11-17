import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkBreadcrumbComponent, HkBreadcrumbItem, HkBreadcrumbVariant } from 'hellskitchen-ui';

export type CrumbVariant = HkBreadcrumbVariant;

/**
 * Three trails over one model.
 *
 * Collapsing is the part that has to be shared: whichever separator you pick,
 * a deep path still has to fit, so the trail keeps the first and the last two
 * and hides the middle behind a control that expands it.
 */
@Component({
  selector: 'app-breadcrumb-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkBreadcrumbComponent],
  template: `
    <div class="w-full max-w-md space-y-4">

      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Breadcrumb variant">
        @for (item of variants; track item.id) {
          <button type="button" (click)="variant.set(item.id)" [attr.aria-pressed]="variant() === item.id"
            [class]="chip(variant() === item.id)">{{ item.label }}</button>
        }
      </div>

      <hk-breadcrumb [variant]="variant()" [items]="trail" [maxVisible]="collapse() ? 4 : trail.length" />

      <button type="button" (click)="collapse.set(!collapse())"
        class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white">
        {{ collapse() ? 'Expand trail' : 'Collapse trail' }}
      </button>
    </div>
  `
})
export class BreadcrumbDemoComponent {
  readonly variants: { id: CrumbVariant; label: string }[] = [
    { id: 'slash', label: 'Slash' },
    { id: 'chevron', label: 'Chevron' },
    { id: 'pills', label: 'Pills' }
  ];

  /** Icons are SVG path data (24×24, stroked). */
  readonly trail: HkBreadcrumbItem[] = [
    { label: 'Home', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    { label: 'Workspaces', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
    { label: 'Night Shift', icon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' },
    { label: 'Services', icon: 'M4 3h16v7H4zM4 14h16v7H4zM8 6.5h.01M8 17.5h.01' },
    { label: 'billing-api', icon: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8' },
    { label: 'Deploys', icon: 'M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1 0 8M12 12v9M9 15l3-3 3 3' }
  ];

  readonly variant = signal<CrumbVariant>('chevron');
  readonly collapse = signal(true);

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
