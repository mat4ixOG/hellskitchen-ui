import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HkConfirmService } from 'hellskitchen-ui';

/** The service returns a promise; here is what awaiting it looks like. */
@Component({
  selector: 'app-confirm-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <button type="button" (click)="ask()"
        class="rounded-xl border border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/70">
        Delete billing-api
      </button>

      <p class="mt-3 h-4 text-xs" [class]="log() === 'Deleted' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-gray-400'">{{ log() }}</p>
    </div>
  `
})
export class ConfirmDemoComponent {
  private readonly confirm = inject(HkConfirmService);
  readonly log = signal('');

  async ask(): Promise<void> {
    this.log.set('');
    const ok = await this.confirm.ask({
      title: 'Delete this service?',
      body: 'Every deploy record and log stream goes with it. This cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      tone: 'danger'
    });
    this.log.set(ok ? 'Deleted' : 'Cancelled — nothing changed');
  }
}
