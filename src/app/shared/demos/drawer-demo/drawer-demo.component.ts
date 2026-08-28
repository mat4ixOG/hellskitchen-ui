import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type Side = 'left' | 'right' | 'bottom';

/** Edge sheet from any side; the panel animates, the scrim fades. */
@Component({
  selector: 'app-drawer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative h-56 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
      <div class="flex flex-wrap gap-1.5 p-4">
        @for (option of sides; track option) {
          <button type="button" (click)="show(option)"
            class="rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1 text-xs capitalize text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
            Open {{ option }}
          </button>
        }
      </div>

      @if (side()) {
        <div class="absolute inset-0 z-10 bg-slate-900/40" (click)="side.set(null)" aria-hidden="true"></div>
        <aside role="dialog" aria-label="Filters"
          class="absolute z-20 border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-4 shadow-2xl"
          [class]="skin()">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900 dark:text-white">Filters</p>
              <p class="mt-0.5 text-xs text-slate-600 dark:text-gray-400">Opened from the {{ side() }}.</p>
            </div>
            <button type="button" class="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white" (click)="side.set(null)"
              aria-label="Close">&times;</button>
          </div>
          <ul class="mt-4 space-y-2 text-xs text-slate-600 dark:text-gray-400">
            <li>· Region</li>
            <li>· Owning team</li>
            <li>· Health</li>
          </ul>
        </aside>
      }
    </div>
  `
})
export class DrawerDemoComponent {
  readonly sides: Side[] = ['left', 'right', 'bottom'];
  readonly side = signal<Side | null>(null);

  show(side: Side): void {
    this.side.set(side);
  }

  skin(): string {
    const map: Record<Side, string> = {
      left: 'inset-y-0 left-0 w-56 border-r',
      right: 'inset-y-0 right-0 w-56 border-l',
      bottom: 'inset-x-0 bottom-0 h-36 border-t rounded-t-2xl'
    };
    return map[this.side() ?? 'right'];
  }
}
