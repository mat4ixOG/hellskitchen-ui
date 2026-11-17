import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkDrawerComponent } from 'hellskitchen-ui';

type Side = 'left' | 'right' | 'bottom';

/** Edge sheet from any side; the panel animates, the scrim fades. */
@Component({
  selector: 'app-drawer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkDrawerComponent],
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

      <hk-drawer [(open)]="open" [side]="side()" [size]="side() === 'bottom' ? '9rem' : '14rem'" label="Filters">
        <p class="text-sm font-semibold text-slate-900 dark:text-white">Filters</p>
        <p class="mt-0.5 text-xs text-slate-600 dark:text-gray-400">Opened from the {{ side() }}.</p>
        <ul class="mt-4 space-y-2 text-xs text-slate-600 dark:text-gray-400">
          <li>· Region</li>
          <li>· Owning team</li>
          <li>· Health</li>
        </ul>
      </hk-drawer>
    </div>
  `
})
export class DrawerDemoComponent {
  readonly sides: Side[] = ['left', 'right', 'bottom'];
  readonly side = signal<Side>('right');
  readonly open = signal(false);

  show(side: Side): void {
    this.side.set(side);
    this.open.set(true);
  }
}
