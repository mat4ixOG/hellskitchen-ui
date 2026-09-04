import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

export type CrumbVariant = 'slash' | 'chevron' | 'pills';

interface Crumb {
  label: string;
  icon: string;
}

/**
 * Three trails over one model.
 *
 * Collapsing is the part that has to be shared: whichever separator you pick,
 * a deep path still has to fit, so `shown()` keeps the first and the last two
 * and hides the middle behind a control that expands it. `null` marks the gap,
 * which keeps the templates declarative and the rule in one place.
 */
@Component({
  selector: 'app-breadcrumb-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-md space-y-4">

      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Breadcrumb variant">
        @for (item of variants; track item.id) {
          <button type="button" (click)="variant.set(item.id)" [attr.aria-pressed]="variant() === item.id"
            [class]="chip(variant() === item.id)">{{ item.label }}</button>
        }
      </div>

      @switch (variant()) {

        <!-- ── Slash: the plain one ───────────────────────────── -->
        @case ('slash') {
          <nav aria-label="Breadcrumb"
            class="flex items-center gap-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-neutral-950">
            @for (crumb of shown(); track $index; let last = $last) {
              @if (crumb === null) {
                <button type="button" class="px-1 text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                  (click)="collapse.set(false)" aria-label="Show hidden path">…</button>
              } @else {
                <span class="truncate" [class]="last
                  ? 'font-semibold text-slate-900 dark:text-white'
                  : 'cursor-pointer text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200'"
                  [attr.aria-current]="last ? 'page' : null">{{ crumb.label }}</span>
              }
              @if (!last) { <span class="text-slate-400 dark:text-gray-500" aria-hidden="true">/</span> }
            }
          </nav>
        }

        <!-- ── Chevron: icons, and the leading crumb reduced to one ── -->
        @case ('chevron') {
          <nav aria-label="Breadcrumb"
            class="flex items-center gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm dark:border-white/10 dark:bg-neutral-950">
            @for (crumb of shown(); track $index; let last = $last; let first = $first) {
              @if (crumb === null) {
                <button type="button" (click)="collapse.set(false)" aria-label="Show hidden path"
                  class="rounded-md px-1.5 py-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white">
                  <i class="pi pi-ellipsis-h text-xs"></i>
                </button>
              } @else {
                <span class="flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 transition-colors"
                  [class]="last
                    ? 'font-semibold text-slate-900 dark:text-white'
                    : 'cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'"
                  [attr.aria-current]="last ? 'page' : null">
                  <i class="pi text-[0.7rem]" [class]="crumb.icon"></i>
                  <!-- The root collapses to its icon; everything else keeps its label. -->
                  @if (!first) { <span class="truncate">{{ crumb.label }}</span> }
                </span>
              }
              @if (!last) {
                <i class="pi pi-angle-right shrink-0 text-[0.65rem] text-slate-300 dark:text-gray-600" aria-hidden="true"></i>
              }
            }
          </nav>
        }

        <!-- ── Pills: a path bar, last segment carries the accent ── -->
        @case ('pills') {
          <nav aria-label="Breadcrumb"
            class="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
            @for (crumb of shown(); track $index; let last = $last) {
              @if (crumb === null) {
                <button type="button" (click)="collapse.set(false)" aria-label="Show hidden path"
                  class="rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-800 dark:border-white/15 dark:text-gray-400 dark:hover:text-white">
                  +{{ hidden() }}
                </button>
              } @else {
                <span class="truncate rounded-lg px-2.5 py-1 text-xs transition-colors"
                  [class]="last
                    ? 'bg-gradient-to-r from-red-600 to-red-700 font-semibold text-white shadow-sm shadow-red-500/25'
                    : 'cursor-pointer border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-400 dark:hover:text-white'"
                  [attr.aria-current]="last ? 'page' : null">{{ crumb.label }}</span>
              }
            }
          </nav>
        }
      }

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

  readonly trail: Crumb[] = [
    { label: 'Home', icon: 'pi-home' },
    { label: 'Workspaces', icon: 'pi-th-large' },
    { label: 'Night Shift', icon: 'pi-moon' },
    { label: 'Services', icon: 'pi-server' },
    { label: 'billing-api', icon: 'pi-box' },
    { label: 'Deploys', icon: 'pi-cloud-upload' }
  ];

  readonly variant = signal<CrumbVariant>('chevron');
  readonly collapse = signal(true);

  /** Keeps the first and last two, drops the middle behind an ellipsis. */
  readonly shown = computed<(Crumb | null)[]>(() => {
    if (!this.collapse() || this.trail.length <= 4) return this.trail;
    return [this.trail[0], null, ...this.trail.slice(-2)];
  });

  readonly hidden = computed(() => Math.max(0, this.trail.length - 3));

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
