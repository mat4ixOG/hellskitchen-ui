import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  HkPopoverAlign,
  HkPopoverComponent,
  HkPopoverPlacement,
  HkPopoverSide,
  HkPopoverTriggerDirective
} from 'hellskitchen-ui';

/**
 * Anchored panel with a placement you choose, and a flip when it will not fit.
 *
 * Placement is one string — `side` plus optional `alignment` — because those
 * are the only two decisions there are: which edge of the trigger the panel
 * hangs off, and how it lines up along that edge. Both the panel and its arrow
 * are derived from that one value, so they can never disagree.
 *
 * `flip` is what separates a placement *preference* from a placement *promise*:
 * with it on, a panel that would leave the viewport swaps to the opposite side
 * instead of being clipped.
 */
@Component({
  selector: 'app-popover-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkPopoverComponent, HkPopoverTriggerDirective],
  template: `
    <div class="w-full max-w-xl">

      <!-- Controls -->
      <div class="mb-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-3">
        <div role="group" aria-label="Side">
          <span class="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-500">Side</span>
          <div class="mt-1.5 flex flex-wrap gap-1">
            @for (item of sides; track item) {
              <button type="button" (click)="side.set(item)" [attr.aria-pressed]="side() === item"
                [class]="chip(side() === item)">{{ item }}</button>
            }
          </div>
        </div>

        <div role="group" aria-label="Alignment">
          <span class="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-500">Align</span>
          <div class="mt-1.5 flex flex-wrap gap-1">
            @for (item of alignments; track item) {
              <button type="button" (click)="align.set(item)" [attr.aria-pressed]="align() === item"
                [class]="chip(align() === item)">{{ item }}</button>
            }
          </div>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
          <input type="checkbox" [checked]="flip()" (change)="flip.set($any($event.target).checked)"
            class="h-3.5 w-3.5 accent-red-600" />
          Flip when there is no room
        </label>
      </div>

      <!-- Stage. Deliberately not clipping: a popover escapes its container by
           design — it flips against the viewport, not against the nearest box —
           so clipping here would slice panels a real one would have placed
           fine, and would hide the very placement being demonstrated. -->
      <div class="relative flex h-56 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <hk-popover #pop [placement]="placement()" [flip]="flip()" [(open)]="open">
          <button type="button" hkPopoverTrigger
            class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 hover:border-slate-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:hover:border-white/25">
            Deploy details
          </button>

          <div hkPopoverContent aria-label="Deploy details">
            <p class="text-xs font-semibold text-slate-900 dark:text-white">v4.2.0 · canary</p>
            <dl class="mt-2 space-y-1 text-xs text-slate-600 dark:text-gray-400">
              <div class="flex justify-between gap-2"><dt>Traffic</dt><dd class="text-slate-700 dark:text-gray-300">5%</dd></div>
              <div class="flex justify-between gap-2"><dt>Started</dt><dd class="text-slate-700 dark:text-gray-300">14m</dd></div>
              <div class="flex justify-between gap-2"><dt>Errors</dt><dd class="text-emerald-600 dark:text-emerald-400">0.02%</dd></div>
            </dl>
          </div>
        </hk-popover>
      </div>

      <!-- Room left for an unflipped panel to overhang into, since that
           overhang is the thing being demonstrated. -->
      <p class="mt-10 text-xs text-slate-600 dark:text-gray-400">
        <code class="text-red-600 dark:text-red-400">[placement]="'{{ placement() }}'"</code>
        @if (open() && pop.resolvedSide() !== side()) {
          <span class="ml-1">— no room on that side of the viewport, so it flipped to <b>{{ pop.resolvedSide() }}</b>.</span>
        } @else if (side() === 'bottom' && !flip()) {
          <span class="ml-1">— with flip off it stays put and runs off instead.</span>
        }
      </p>
    </div>
  `
})
export class PopoverDemoComponent {
  readonly sides: HkPopoverSide[] = ['top', 'right', 'bottom', 'left'];
  readonly alignments: HkPopoverAlign[] = ['start', 'center', 'end'];

  readonly open = signal(true);
  readonly flip = signal(true);
  readonly side = signal<HkPopoverSide>('top');
  readonly align = signal<HkPopoverAlign>('center');

  readonly placement = computed<HkPopoverPlacement>(() => {
    const align = this.align();
    return align === 'center' ? this.side() : `${this.side()}-${align}`;
  });

  chip(active: boolean): string {
    const base =
      'cursor-pointer rounded-md border px-2 py-0.5 text-[0.72rem] capitalize transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
