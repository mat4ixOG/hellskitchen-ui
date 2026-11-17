import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  HkDialogBodyDirective,
  HkDialogCloseDirective,
  HkDialogComponent,
  HkDialogTitleDirective
} from 'hellskitchen-ui';

/** Built on <dialog>, so focus trapping and Esc come from the platform. */
@Component({
  selector: 'app-dialog-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkDialogComponent, HkDialogTitleDirective, HkDialogBodyDirective, HkDialogCloseDirective],
  template: `
    <div class="w-full max-w-sm">
      <button type="button" (click)="open()"
        class="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-2.5 text-sm font-semibold text-white">
        Invite teammates
      </button>
      @if (result()) { <p class="mt-3 text-xs text-slate-600 dark:text-gray-400">Closed with: <b class="text-slate-900 dark:text-white">{{ result() }}</b></p> }

      <hk-dialog #invite (closed)="result.set($event)">
        <h3 hkDialogTitle>Invite to Night Shift</h3>
        <p hkDialogBody>They will get read access to every service.</p>
        <input placeholder="name@company.com" autofocus
          class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500 dark:focus:border-red-600/70" />
        <button hkDialogClose value="cancel">Cancel</button>
        <button hkDialogClose value="invited">Send invite</button>
      </hk-dialog>
    </div>
  `
})
export class DialogDemoComponent {
  private readonly invite = viewChild.required<HkDialogComponent>('invite');
  readonly result = signal('');

  open(): void {
    this.result.set('');
    this.invite().open();
  }
}
