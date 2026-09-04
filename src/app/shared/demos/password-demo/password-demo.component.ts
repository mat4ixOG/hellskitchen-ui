import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface Rule {
  label: string;
  test: (value: string) => boolean;
}

/**
 * Password field with a strength meter, a live rule list and a reveal toggle.
 *
 * Three decisions worth naming:
 *
 *   • **Strength is scored from the rules, not from length.** A twelve-character
 *     run of lowercase is not strong, and telling someone it is does real harm.
 *     The score is the number of satisfied rules, so the meter and the checklist
 *     can never disagree.
 *   • **Reveal is a toggle, not a peek.** Swapping `type` keeps the caret and
 *     the value; re-rendering a different input would lose both. The button
 *     reports its state through `aria-pressed`, so it is not a mystery glyph.
 *   • **Caps Lock is a warning, not an error.** It is the single most common
 *     reason a correct password is rejected, and the browser will not tell you
 *     — `getModifierState` will.
 */
@Component({
  selector: 'app-password-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-3">
      <label class="block">
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Password</span>
        <span class="flex items-center rounded-xl border bg-white transition-colors focus-within:border-red-500 dark:bg-neutral-950 dark:focus-within:border-red-600/70"
          [class]="touched() && !value()
            ? 'border-red-500 dark:border-red-800/70'
            : 'border-slate-200 dark:border-white/10'">
          <span class="pl-3 text-slate-400 dark:text-gray-500"><i class="pi pi-lock text-xs"></i></span>
          <input [type]="revealed() ? 'text' : 'password'" autocomplete="new-password"
            placeholder="Choose something long"
            class="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-gray-500"
            [value]="value()"
            (input)="value.set($any($event.target).value)"
            (blur)="touched.set(true)"
            (keyup)="checkCaps($event)"
            [attr.aria-describedby]="'pw-strength'" />

          <button type="button" (click)="revealed.set(!revealed())" [attr.aria-pressed]="revealed()"
            [attr.aria-label]="revealed() ? 'Hide password' : 'Show password'"
            class="px-3 text-slate-500 transition-colors hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <i class="pi text-xs" [class]="revealed() ? 'pi-eye-slash' : 'pi-eye'"></i>
          </button>
        </span>
      </label>

      @if (capsOn()) {
        <p class="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400" role="status">
          <i class="pi pi-exclamation-triangle text-[0.7rem]"></i> Caps Lock is on.
        </p>
      }

      <!-- Meter: one segment per strength band, so it is countable. -->
      <div id="pw-strength">
        <div class="flex gap-1" role="progressbar" [attr.aria-valuenow]="score()"
          aria-valuemin="0" [attr.aria-valuemax]="rules.length"
          [attr.aria-valuetext]="strength().label">
          @for (band of bands; track band) {
            <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <span class="block h-full origin-left rounded-full transition-transform duration-300"
                [class]="strength().bar"
                [style.transform]="'scaleX(' + (band <= score() ? 1 : 0) + ')'"></span>
            </span>
          }
        </div>
        <p class="mt-1.5 text-xs" [class]="strength().ink">
          {{ value() ? strength().label : 'Enter a password' }}
          @if (value()) { <span class="text-slate-500 dark:text-gray-500">· {{ value().length }} characters</span> }
        </p>
      </div>

      <!-- Rules stay visible rather than appearing as errors after the fact:
           a requirement you can see is one you can meet on the first try. -->
      <ul class="space-y-1">
        @for (rule of rules; track rule.label) {
          <li class="flex items-center gap-2 text-xs transition-colors"
            [class]="rule.test(value()) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-500'">
            <i class="pi text-[0.65rem]" [class]="rule.test(value()) ? 'pi-check-circle' : 'pi-circle'"></i>
            {{ rule.label }}
          </li>
        }
      </ul>

      <button type="button" (click)="generate()"
        class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/25 dark:hover:text-white">
        <i class="pi pi-refresh mr-1.5 text-[0.7rem]"></i> Generate a strong one
      </button>
    </div>
  `
})
export class PasswordDemoComponent {
  readonly rules: Rule[] = [
    { label: 'At least 12 characters', test: (value) => value.length >= 12 },
    { label: 'An uppercase letter', test: (value) => /[A-Z]/.test(value) },
    { label: 'A lowercase letter', test: (value) => /[a-z]/.test(value) },
    { label: 'A number', test: (value) => /[0-9]/.test(value) },
    { label: 'A symbol', test: (value) => /[^A-Za-z0-9]/.test(value) }
  ];

  readonly bands = [1, 2, 3, 4, 5];

  readonly value = signal('');
  readonly revealed = signal(false);
  readonly touched = signal(false);
  readonly capsOn = signal(false);

  /** The meter and the checklist read the same number, so they cannot drift. */
  readonly score = computed(() => this.rules.filter((rule) => rule.test(this.value())).length);

  readonly strength = computed(() => {
    const score = this.score();
    if (score <= 1) return { label: 'Too weak', bar: 'bg-red-600', ink: 'text-red-600 dark:text-red-400' };
    if (score === 2) return { label: 'Weak', bar: 'bg-orange-500', ink: 'text-orange-600 dark:text-orange-400' };
    if (score === 3) return { label: 'Fair', bar: 'bg-amber-500', ink: 'text-amber-600 dark:text-amber-400' };
    if (score === 4) return { label: 'Strong', bar: 'bg-lime-500', ink: 'text-lime-600 dark:text-lime-400' };
    return { label: 'Excellent', bar: 'bg-emerald-500', ink: 'text-emerald-600 dark:text-emerald-400' };
  });

  /** The browser will not warn about Caps Lock; the event knows. */
  checkCaps(event: KeyboardEvent): void {
    this.capsOn.set(event.getModifierState?.('CapsLock') ?? false);
  }

  /** crypto.getRandomValues, not Math.random — this is a credential. */
  generate(): void {
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_';
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    this.value.set([...bytes].map((byte) => alphabet[byte % alphabet.length]).join(''));
    this.revealed.set(true);
    this.touched.set(true);
  }
}
