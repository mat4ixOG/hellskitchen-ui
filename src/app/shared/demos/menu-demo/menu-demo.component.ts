import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkMenuComponent, HkMenuItem, HkMenuTriggerStyle } from 'hellskitchen-ui';

export type TriggerStyle = HkMenuTriggerStyle;

/**
 * Nested menu with hover-opened submenus and a destructive item.
 *
 * The trigger is a slot, not a fixed button. `icon` is the default because a
 * burger is what a menu usually hangs off; `label` and `both` exist for the
 * toolbars where the word carries meaning the glyph does not. Whichever is
 * chosen, the button keeps an accessible name.
 */
@Component({
  selector: 'app-menu-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkMenuComponent],
  template: `
    <div class="w-full max-w-xs space-y-3">

      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Trigger style">
        @for (item of triggers; track item.id) {
          <button type="button" (click)="trigger.set(item.id)" [attr.aria-pressed]="trigger() === item.id"
            [class]="chip(trigger() === item.id)">{{ item.label }}</button>
        }
      </div>

      <hk-menu [items]="items" [trigger]="trigger()" triggerLabel="Actions" (select)="last.set($event.label)" />

      @if (last()) {
        <p class="text-xs text-slate-600 dark:text-gray-400">Chose <b class="text-slate-900 dark:text-white">{{ last() }}</b></p>
      }
    </div>
  `
})
export class MenuDemoComponent {
  readonly triggers: { id: TriggerStyle; label: string }[] = [
    { id: 'icon', label: 'Burger only' },
    { id: 'label', label: 'Label only' },
    { id: 'both', label: 'Both' }
  ];

  readonly items: HkMenuItem[] = [
    { label: 'Rename', hint: '⌘R' },
    { label: 'Duplicate', hint: '⌘D' },
    {
      label: 'Move to',
      children: [{ label: 'Platform' }, { label: 'Payments' }, { label: 'Archive' }]
    },
    { label: 'Delete service', danger: true }
  ];

  readonly trigger = signal<TriggerStyle>('icon');
  readonly last = signal('');

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
