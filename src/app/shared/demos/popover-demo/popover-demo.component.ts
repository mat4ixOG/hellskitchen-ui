import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';
/** `side`, or `side-alignment` when the alignment is not centred. */
export type Placement = Side | `${Side}-${'start' | 'end'}`;

/**
 * Anchored panel with a placement you choose, and a flip when it will not fit.
 *
 * Placement is one string — `side` plus optional `alignment` — because those
 * are the only two decisions there are: which edge of the trigger the panel
 * hangs off, and how it lines up along that edge. Both the panel and its arrow
 * are derived from that one value, so they can never disagree.
 *
 * `flip` is what separates a placement *preference* from a placement *promise*:
 * with it on, a panel that would leave the container swaps to the opposite side
 * instead of being clipped.
 */
@Component({
  selector: 'app-popover-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <div class="relative">
          <button type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()"
            class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 hover:border-slate-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:hover:border-white/25">
            Deploy details
          </button>

          @if (open()) {
            <div role="dialog" aria-label="Deploy details"
              class="absolute z-20 w-44 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-neutral-950 dark:shadow-black/60"
              [class]="panelClass()">
              <p class="text-xs font-semibold text-slate-900 dark:text-white">v4.2.0 · canary</p>
              <dl class="mt-2 space-y-1 text-xs text-slate-600 dark:text-gray-400">
                <div class="flex justify-between gap-2"><dt>Traffic</dt><dd class="text-slate-700 dark:text-gray-300">5%</dd></div>
                <div class="flex justify-between gap-2"><dt>Started</dt><dd class="text-slate-700 dark:text-gray-300">14m</dd></div>
                <div class="flex justify-between gap-2"><dt>Errors</dt><dd class="text-emerald-600 dark:text-emerald-400">0.02%</dd></div>
              </dl>
              <span aria-hidden="true"
                class="absolute h-2 w-2 rotate-45 border-slate-200 bg-white dark:border-white/10 dark:bg-neutral-950"
                [class]="arrowClass()"></span>
            </div>
          }
        </div>
      </div>

      <!-- Room left for an unflipped panel to overhang into, since that
           overhang is the thing being demonstrated. -->
      <p class="mt-10 text-xs text-slate-600 dark:text-gray-400">
        <code class="text-red-600 dark:text-red-400">[placement]="'{{ placement() }}'"</code>
        @if (flipped()) {
          <span class="ml-1">— no room below the fold here, so it flipped to <b>top</b>.</span>
        } @else if (side() === 'bottom') {
          <span class="ml-1">— with flip off it stays put and runs off instead.</span>
        }
      </p>
    </div>
  `
})
export class PopoverDemoComponent {
  readonly sides: Side[] = ['top', 'right', 'bottom', 'left'];
  readonly alignments: Align[] = ['start', 'center', 'end'];

  readonly open = signal(true);
  readonly flip = signal(true);
  readonly side = signal<Side>('top');
  readonly align = signal<Align>('center');

  /**
   * The trigger sits on the container's bottom edge, so `bottom` is the one
   * side that genuinely does not fit here. A real implementation measures;
   * this demo knows its own stage.
   */
  readonly flipped = computed(() => this.flip() && this.side() === 'bottom');

  readonly resolved = computed(() => (this.flipped() ? 'top' : this.side()));

  readonly placement = computed<Placement>(() => {
    const align = this.align();
    return align === 'center' ? this.side() : `${this.side()}-${align}`;
  });

  /** Where the panel sits relative to the trigger. */
  readonly panelClass = computed(() => {
    const side = this.resolved();
    const align = this.align();

    if (side === 'top' || side === 'bottom') {
      const vertical = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
      const horizontal =
        align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';
      return `${vertical} ${horizontal}`;
    }

    const horizontal = side === 'left' ? 'right-full mr-2' : 'left-full ml-2';
    const vertical =
      align === 'start' ? 'top-0' : align === 'end' ? 'bottom-0' : 'top-1/2 -translate-y-1/2';
    return `${horizontal} ${vertical}`;
  });

  /** The arrow always points back at the trigger, so it mirrors the panel. */
  readonly arrowClass = computed(() => {
    const side = this.resolved();
    const align = this.align();

    if (side === 'top' || side === 'bottom') {
      const edge =
        side === 'top'
          ? 'top-full -translate-y-1 border-b border-r'
          : 'bottom-full translate-y-1 border-l border-t';
      const along =
        align === 'start' ? 'left-4' : align === 'end' ? 'right-4' : 'left-1/2 -translate-x-1/2';
      return `${edge} ${along}`;
    }

    const edge =
      side === 'left'
        ? 'left-full -translate-x-1 border-r border-t'
        : 'right-full translate-x-1 border-b border-l';
    const along =
      align === 'start' ? 'top-4' : align === 'end' ? 'bottom-4' : 'top-1/2 -translate-y-1/2';
    return `${edge} ${along}`;
  });

  chip(active: boolean): string {
    const base =
      'cursor-pointer rounded-md border px-2 py-0.5 text-[0.72rem] capitalize transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
