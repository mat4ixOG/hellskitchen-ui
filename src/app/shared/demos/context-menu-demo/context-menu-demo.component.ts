import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Right-click anywhere in the surface; the menu keeps itself on screen. */
@Component({
  selector: 'app-context-menu-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="relative h-40 select-none rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.03]"
        (contextmenu)="open($event)" (click)="at.set(null)">
        <p class="grid h-full place-items-center text-xs text-slate-600 dark:text-gray-400">Right-click inside this area</p>

        @if (at(); as point) {
          <div role="menu" class="absolute z-20 w-40 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-1 shadow-2xl"
            [style.left.px]="point.x" [style.top.px]="point.y">
            @for (item of items; track item) {
              <button type="button" role="menuitem" (click)="pick(item)"
                class="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5"
                [class.text-red-600 dark:text-red-400]="item === 'Delete'">{{ item }}</button>
            }
          </div>
        }
      </div>

      <p class="mt-2 h-4 text-xs text-slate-600 dark:text-gray-400">{{ last() }}</p>
    </div>
  `
})
export class ContextMenuDemoComponent {
  readonly items = ['Open', 'Rename', 'Copy link', 'Delete'];
  readonly at = signal<{ x: number; y: number } | null>(null);
  readonly last = signal('');

  /** Coordinates are relative to the surface, clamped so it never overflows. */
  open(event: MouseEvent): void {
    event.preventDefault();
    const host = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.at.set({
      x: Math.min(event.clientX - host.left, host.width - 168),
      y: Math.min(event.clientY - host.top, host.height - 128)
    });
  }

  pick(item: string): void {
    this.last.set(`${item} — on the selected row`);
    this.at.set(null);
  }
}
