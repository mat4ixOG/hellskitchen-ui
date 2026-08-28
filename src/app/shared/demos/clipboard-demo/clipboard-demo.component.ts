import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Copy with a confirmation state that reverts on its own. */
@Component({
  selector: 'app-clipboard-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-3">
      <div class="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-1.5 pl-3">
        <code class="flex-1 truncate font-mono text-xs text-slate-700 dark:text-gray-300">{{ snippet }}</code>
        <button type="button" (click)="copy(snippet)"
          class="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors"
          [class]="copied() === snippet
            ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'">
          {{ copied() === snippet ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <div class="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-1.5 pl-3">
        <code class="flex-1 truncate font-mono text-xs text-slate-700 dark:text-gray-300">{{ token }}</code>
        <button type="button" (click)="copy(token)"
          class="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors"
          [class]="copied() === token
            ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'">
          {{ copied() === token ? 'Copied' : 'Copy' }}
        </button>
      </div>

      @if (failed()) {
        <p class="text-xs text-amber-600 dark:text-amber-400">Clipboard blocked by the browser — the directive reports that too.</p>
      }
    </div>
  `
})
export class ClipboardDemoComponent {
  readonly snippet = 'npm i @hellskitchen/ui';
  readonly token = 'hk_live_9f2c41d8a7b3';

  readonly copied = signal('');
  readonly failed = signal(false);

  async copy(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.failed.set(false);
      this.copied.set(value);
      setTimeout(() => this.copied.set(''), 1600);
    } catch {
      this.failed.set(true);
    }
  }
}
