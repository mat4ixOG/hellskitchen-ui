import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';

/** Built on <dialog>, so focus trapping and Esc come from the platform. */
@Component({
  selector: 'app-dialog-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <button type="button" (click)="open()"
        class="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-2.5 text-sm font-semibold text-white">
        Invite teammates
      </button>
      @if (result()) { <p class="mt-3 text-xs text-slate-600 dark:text-gray-400">Closed with: <b class="text-slate-900 dark:text-white">{{ result() }}</b></p> }

      <dialog #box (close)="result.set(box.returnValue || 'dismissed')"
        class="w-[22rem] max-w-[90vw] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-0 text-left text-slate-700 dark:text-gray-300 backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm">
        <form method="dialog">
          <div class="border-b border-slate-200 dark:border-white/10 px-5 py-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Invite to Night Shift</h3>
            <p class="mt-1 text-xs text-slate-600 dark:text-gray-400">They will get read access to every service.</p>
          </div>
          <div class="px-5 py-4">
            <input placeholder="name@company.com" autofocus
              class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500 dark:focus:border-red-600/70" />
          </div>
          <div class="flex justify-end gap-2 border-t border-slate-200 dark:border-white/10 px-5 py-3">
            <button value="cancel" class="rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">Cancel</button>
            <button value="invited" class="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Send invite</button>
          </div>
        </form>
      </dialog>
    </div>
  `
})
export class DialogDemoComponent {
  private readonly box = viewChild<ElementRef<HTMLDialogElement>>('box');
  readonly result = signal('');

  open(): void {
    this.result.set('');
    this.box()?.nativeElement.showModal();
  }
}
