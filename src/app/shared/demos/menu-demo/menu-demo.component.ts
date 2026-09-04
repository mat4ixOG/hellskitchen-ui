import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface MenuItem {
  label: string;
  hint?: string;
  danger?: boolean;
  children?: MenuItem[];
}

export type TriggerStyle = 'icon' | 'label' | 'both';

/**
 * Nested menu with hover-opened submenus and a destructive item.
 *
 * The trigger is a slot, not a fixed button. `icon` is the default because a
 * burger is what a menu usually hangs off; `label` and `both` exist for the
 * toolbars where the word carries meaning the glyph does not. Whichever is
 * chosen, the button keeps an accessible name — an icon-only trigger with no
 * `aria-label` is a menu no screen reader can announce.
 */
@Component({
  selector: 'app-menu-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-xs space-y-3">

      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Trigger style">
        @for (item of triggers; track item.id) {
          <button type="button" (click)="trigger.set(item.id)" [attr.aria-pressed]="trigger() === item.id"
            [class]="chip(trigger() === item.id)">{{ item.label }}</button>
        }
      </div>

      <div class="relative">
        <button type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()"
          aria-haspopup="true" aria-label="Actions"
          class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 transition-colors hover:border-slate-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:hover:border-white/25"
          [class]="trigger() === 'icon' ? 'h-9 w-9 justify-center' : 'px-3.5 py-2'">

          @if (trigger() !== 'label') {
            <!-- Three bars that fold into an X while the menu is open. -->
            <span class="relative block h-3.5 w-4" aria-hidden="true">
              <span class="absolute left-0 h-0.5 w-4 rounded-full bg-current transition-all duration-300"
                [class]="open() ? 'top-1.5 rotate-45' : 'top-0'"></span>
              <span class="absolute left-0 top-1.5 h-0.5 w-4 rounded-full bg-current transition-all duration-200"
                [class]="open() ? 'opacity-0' : 'opacity-100'"></span>
              <span class="absolute left-0 h-0.5 w-4 rounded-full bg-current transition-all duration-300"
                [class]="open() ? 'top-1.5 -rotate-45' : 'top-3'"></span>
            </span>
          }

          @if (trigger() !== 'icon') {
            <span>Actions</span>
            <span class="text-slate-500 transition-transform dark:text-gray-400" [class.rotate-180]="open()">▾</span>
          }
        </button>

        @if (open()) {
          <div class="absolute z-20 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-neutral-950 dark:shadow-black/60"
            role="menu">
            @for (item of items; track item.label) {
              <div class="relative" (mouseenter)="hover.set(item.label)" (mouseleave)="hover.set(null)">
                <button type="button" role="menuitem" (click)="choose(item)"
                  class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                  [class]="item.danger ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-gray-300'">
                  <span>{{ item.label }}</span>
                  @if (item.children) { <span class="text-slate-400 dark:text-gray-500">›</span> }
                  @else if (item.hint) { <span class="font-mono text-[0.72rem] text-slate-400 dark:text-gray-500">{{ item.hint }}</span> }
                </button>

                @if (item.children && hover() === item.label) {
                  <div class="absolute left-full top-0 ml-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl dark:border-white/10 dark:bg-neutral-950">
                    @for (child of item.children; track child.label) {
                      <button type="button" role="menuitem" (click)="choose(child)"
                        class="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/5">
                        {{ child.label }}
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

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

  readonly items: MenuItem[] = [
    { label: 'Rename', hint: '⌘R' },
    { label: 'Duplicate', hint: '⌘D' },
    {
      label: 'Move to',
      children: [{ label: 'Platform' }, { label: 'Payments' }, { label: 'Archive' }]
    },
    { label: 'Delete service', danger: true }
  ];

  readonly trigger = signal<TriggerStyle>('icon');
  readonly open = signal(false);
  readonly hover = signal<string | null>(null);
  readonly last = signal('');

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }

  choose(item: MenuItem): void {
    if (item.children) return;
    this.last.set(item.label);
    this.open.set(false);
  }
}
