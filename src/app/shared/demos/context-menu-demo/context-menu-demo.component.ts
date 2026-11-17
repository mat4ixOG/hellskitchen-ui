import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkContextMenuDirective, HkContextMenuItem } from 'hellskitchen-ui';

/** Right-click anywhere in the surface; the menu keeps itself on screen. */
@Component({
  selector: 'app-context-menu-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkContextMenuDirective],
  template: `
    <div class="w-full max-w-sm">
      <div class="relative h-40 select-none rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.03]"
        [hkContextMenu]="items" (menuSelect)="pick($event)">
        <p class="grid h-full place-items-center text-xs text-slate-600 dark:text-gray-400">Right-click inside this area</p>
      </div>

      <p class="mt-2 h-4 text-xs text-slate-600 dark:text-gray-400">{{ last() }}</p>
    </div>
  `
})
export class ContextMenuDemoComponent {
  readonly items: HkContextMenuItem[] = [
    { label: 'Open' },
    { label: 'Rename' },
    { label: 'Copy link' },
    { label: 'Delete', danger: true }
  ];
  readonly last = signal('');

  pick(item: HkContextMenuItem): void {
    this.last.set(`${item.label} — on the selected row`);
  }
}
