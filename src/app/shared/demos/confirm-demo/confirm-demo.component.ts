import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

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

      @if (pending()) {
        <div class="fixed inset-0 z-40 grid place-items-center bg-slate-900/50 p-4">
          <div role="alertdialog" aria-labelledby="cd-title"
            class="w-[20rem] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-5 text-left">
            <p id="cd-title" class="text-sm font-bold text-slate-900 dark:text-white">Delete this service?</p>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-gray-400">
              Every deploy record and log stream goes with it. This cannot be undone.
            </p>
            <div class="mt-4 flex justify-end gap-2">
              <button type="button" class="rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                (click)="answer(false)">Keep it</button>
              <button type="button" class="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
                (click)="answer(true)" autofocus>Delete</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ConfirmDemoComponent {
  readonly pending = signal(false);
  readonly log = signal('');
  private resolver: ((ok: boolean) => void) | null = null;

  /** Mirrors HkConfirmService.ask(): one await, no template plumbing. */
  private confirm(): Promise<boolean> {
    this.pending.set(true);
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  async ask(): Promise<void> {
    this.log.set('');
    const ok = await this.confirm();
    this.log.set(ok ? 'Deleted' : 'Cancelled — nothing changed');
  }

  answer(ok: boolean): void {
    this.pending.set(false);
    this.resolver?.(ok);
    this.resolver = null;
  }
}
