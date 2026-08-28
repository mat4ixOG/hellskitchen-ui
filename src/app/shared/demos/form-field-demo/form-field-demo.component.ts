import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/** Label, hint, error and aria wiring for any control you drop inside. */
@Component({
  selector: 'app-form-field-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="w-full max-w-sm space-y-4" (submit)="submit($event)">
      <div>
        <label for="ff-email" class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">
          Work email <span class="text-red-600 dark:text-red-400">*</span>
        </label>
        <input id="ff-email" type="email" [value]="email()"
          (input)="email.set($any($event.target).value)" (blur)="touched.set(true)"
          [attr.aria-invalid]="showError()" [attr.aria-describedby]="showError() ? 'ff-error' : 'ff-hint'"
          class="w-full rounded-xl border bg-white dark:bg-neutral-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors"
          [class]="showError() ? 'border-red-400 dark:border-red-600/50' : 'border-slate-200 dark:border-white/10 focus:border-red-500 dark:focus:border-red-600/70'" />
        @if (showError()) {
          <p id="ff-error" class="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <span aria-hidden="true">⚠</span> Use your company address.
          </p>
        } @else {
          <p id="ff-hint" class="mt-1.5 text-xs text-slate-600 dark:text-gray-400">We only use this for deploy alerts.</p>
        }
      </div>

      <button type="submit" [disabled]="showError() || !email()"
        class="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-800 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40">
        {{ sent() ? 'Saved' : 'Save' }}
      </button>
    </form>
  `
})
export class FormFieldDemoComponent {
  readonly email = signal('deb@');
  readonly touched = signal(false);
  readonly sent = signal(false);

  readonly showError = computed(
    () => this.touched() && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(this.email())
  );

  submit(event: Event): void {
    event.preventDefault();
    this.touched.set(true);
    if (this.showError()) return;
    this.sent.set(true);
    setTimeout(() => this.sent.set(false), 1600);
  }
}
