import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkControlDirective, HkFormFieldComponent } from 'hellskitchen-ui';

/** Label, hint, error and aria wiring for any control you drop inside. */
@Component({
  selector: 'app-form-field-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkFormFieldComponent, HkControlDirective],
  template: `
    <form class="w-full max-w-sm space-y-4" (submit)="submit($event)">
      <hk-form-field
        label="Work email"
        hint="We only use this for deploy alerts."
        [error]="showError() ? 'Use your company address.' : ''"
        [required]="true">
        <input hkControl type="email" [value]="email()"
          (input)="email.set($any($event.target).value)" (blur)="touched.set(true)" />
      </hk-form-field>

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
