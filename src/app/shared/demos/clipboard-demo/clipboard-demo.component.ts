import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkCopyDirective } from 'hellskitchen-ui';

/** Copy with a confirmation state that reverts on its own. */
@Component({
  selector: 'app-clipboard-demo',
  imports: [HkCopyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-3">
      @for (value of [snippet, token]; track value) {
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-1.5 pl-3">
          <code class="flex-1 truncate font-mono text-xs text-slate-700 dark:text-gray-300">{{ value }}</code>
          <button type="button" [hkCopy]="value" #copy="hkCopy"
            (copied)="failed.set(false)" (copyFailed)="failed.set(true)"
            class="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors"
            [class]="copy.confirmed()
              ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'">
            {{ copy.confirmed() ? 'Copied' : 'Copy' }}
          </button>
        </div>
      }

      @if (failed()) {
        <p class="text-xs text-amber-600 dark:text-amber-400">Clipboard blocked by the browser — the directive reports that too.</p>
      }
    </div>
  `
})
export class ClipboardDemoComponent {
  readonly snippet = 'npm i hellskitchen-ui';
  readonly token = 'hk_live_9f2c41d8a7b3';

  readonly failed = signal(false);
}
