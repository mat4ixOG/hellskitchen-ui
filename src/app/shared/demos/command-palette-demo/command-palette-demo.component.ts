import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkCommandPaletteComponent, HkCommandPaletteItem } from 'hellskitchen-ui';

/** Fuzzy-matched command list with grouped results and arrow-key selection. */
@Component({
  selector: 'app-command-palette-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkCommandPaletteComponent],
  template: `
    <div class="w-full max-w-md">
      <hk-command-palette [(open)]="open" [commands]="commands" placeholder="Type a command or search…"
        (run)="ran.set($event.label)">
        @if (ran()) {
          <p class="border-t border-slate-200 dark:border-white/10 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400">Ran: {{ ran() }}</p>
        }
      </hk-command-palette>

      @if (!open()) {
        <button type="button" (click)="open.set(true)"
          class="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
          Open palette (⌘K / Ctrl+K)
        </button>
      }
    </div>
  `
})
export class CommandPaletteDemoComponent {
  readonly commands: HkCommandPaletteItem[] = [
    { label: 'Deploy billing-api', group: 'Actions', hint: '⌘⏎' },
    { label: 'Roll back last deploy', group: 'Actions' },
    { label: 'Open incident channel', group: 'Actions' },
    { label: 'Go to Services', group: 'Navigate', hint: 'G S' },
    { label: 'Go to Deploys', group: 'Navigate', hint: 'G D' },
    { label: 'Toggle dark mode', group: 'Preferences' },
    { label: 'Change accent colour', group: 'Preferences' }
  ];

  readonly open = signal(true);
  readonly ran = signal('');
}
