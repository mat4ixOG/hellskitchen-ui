import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HkHotkeyService } from 'hellskitchen-ui';

/** Scoped shortcuts that unbind themselves when the scope goes away. */
@Component({
  selector: 'app-hotkey-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-4">
        <p class="text-xs text-slate-600 dark:text-gray-400">Press one of these anywhere on the page:</p>
        <ul class="mt-3 space-y-2">
          @for (binding of bindings; track binding.keys) {
            <li class="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors"
              [class]="last() === binding.keys ? 'bg-red-50 dark:bg-red-950/40' : ''">
              <span class="text-xs text-slate-700 dark:text-gray-300">{{ binding.label }}</span>
              <kbd class="rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.72rem] text-slate-600 dark:text-gray-400">
                {{ binding.keys }}
              </kbd>
            </li>
          }
        </ul>
      </div>
      <p class="mt-2 h-4 text-xs text-slate-600 dark:text-gray-400">{{ log() }}</p>
    </div>
  `
})
export class HotkeyDemoComponent {
  private readonly hotkeys = inject(HkHotkeyService);

  readonly bindings = [
    { keys: 'g', label: 'Go to services' },
    { keys: 'd', label: 'Deploy current service' },
    { keys: '?', label: 'Show shortcut sheet' }
  ];

  readonly last = signal('');
  readonly log = signal('');

  constructor() {
    // Unbound automatically when this demo is destroyed.
    for (const binding of this.bindings) {
      this.hotkeys.bind(binding.keys, () => {
        this.last.set(binding.keys);
        this.log.set(`Fired: ${binding.label}`);
      });
    }
  }
}
