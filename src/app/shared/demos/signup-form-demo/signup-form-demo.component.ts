import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

export interface SsoProvider {
  id: string;
  label: string;
  icon: string;
  /** Brand ink for the glyph. The buttons themselves stay neutral. */
  ink: string;
}

/**
 * Requires every rule the password field lists, and reports *which* one failed
 * rather than a single opaque `pattern` error. A form that says "invalid" and
 * nothing else makes the user guess.
 */
export function passwordStrength(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) return null;

    const failed: string[] = [];
    if (value.length < 12) failed.push('12 characters');
    if (!/[A-Z]/.test(value)) failed.push('an uppercase letter');
    if (!/[a-z]/.test(value)) failed.push('a lowercase letter');
    if (!/[0-9]/.test(value)) failed.push('a number');
    if (!/[^A-Za-z0-9]/.test(value)) failed.push('a symbol');

    return failed.length ? { weak: { missing: failed } } : null;
  };
}

/**
 * Cross-field, so it belongs on the group. Put on the control it would only
 * see one of the two values it has to compare.
 */
export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

/**
 * A signup form built the way a real one is: reactive, validated per field,
 * cross-validated for the confirm, and with SSO first.
 *
 * SSO sits above the fields, not below them, because a returning user should
 * not scan a form they are not going to fill in. Every provider is one row in
 * `providers` — a new one is data, not markup.
 *
 * Errors are shown on `touched || submitted`, never on every keystroke: telling
 * someone their email is invalid while they are still typing the domain is
 * noise. `submitted` is what surfaces errors for fields never focused at all.
 */
@Component({
  selector: 'app-signup-form-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './signup-form-demo.component.html'
})
export class SignupFormDemoComponent {
  readonly providers: SsoProvider[] = [
    { id: 'google', label: 'Google', icon: 'pi-google', ink: 'text-[#ea4335]' },
    { id: 'github', label: 'GitHub', icon: 'pi-github', ink: 'text-slate-900 dark:text-white' },
    { id: 'microsoft', label: 'Microsoft', icon: 'pi-microsoft', ink: 'text-[#0078d4]' },
    { id: 'apple', label: 'Apple', icon: 'pi-apple', ink: 'text-slate-900 dark:text-white' }
  ];

  readonly roles = ['Engineering', 'Design', 'Product', 'Operations', 'Other'];

  readonly submitted = signal(false);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly revealed = signal(false);
  readonly sso = signal('');

  readonly form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordStrength()]],
        confirm: ['', [Validators.required]],
        role: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
        updates: [true]
      },
      { validators: passwordsMatch }
    );
  }

  control(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  /** One rule for when a message is allowed to appear. */
  showError(name: string): boolean {
    const control = this.control(name);
    return control.invalid && (control.touched || this.submitted());
  }

  /** Named errors, so the message says what to fix. */
  errorFor(name: string): string {
    const control = this.control(name);
    const errors = control.errors ?? {};

    // requiredTrue reports itself as `required`, so the checkbox needs its
    // own wording — "this field is required" says nothing about a tickbox.
    if (errors['required']) {
      return name === 'terms' ? 'You need to accept the terms.' : 'This field is required.';
    }
    if (errors['email']) return 'That does not look like an email address.';
    if (errors['minlength']) return `At least ${errors['minlength'].requiredLength} characters.`;
    if (errors['weak']) return `Still needs ${(errors['weak'].missing as string[]).join(', ')}.`;
    return 'Check this field.';
  }

  /** The confirm field's failure lives on the group, so it is asked separately. */
  get mismatch(): boolean {
    const confirm = this.control('confirm');
    return (
      this.form.hasError('mismatch') &&
      !!confirm.value &&
      (confirm.touched || this.submitted())
    );
  }

  /**
   * `alsoInvalid` carries a failure that lives on the group rather than the
   * control — the confirm field is only wrong relative to the password. The
   * two border classes are chosen here rather than concatenated in the
   * template, where both would end up on the element and the stylesheet's
   * order, not the intent, would decide which one painted.
   */
  fieldClass(name: string, alsoInvalid = false): string {
    const base =
      'flex items-center rounded-xl border bg-white transition-colors focus-within:border-red-500 dark:bg-neutral-950 dark:focus-within:border-red-600/70';
    return this.showError(name) || alsoInvalid
      ? `${base} border-red-500 dark:border-red-700/70`
      : `${base} border-slate-200 dark:border-white/10`;
  }

  /** Counts what is left, so the summary is a number and not a vague nudge. */
  invalidCount(): number {
    const names = ['name', 'email', 'password', 'confirm', 'role', 'terms'];
    const failed = names.filter((name) => this.control(name).invalid).length;
    return failed + (this.form.hasError('mismatch') ? 1 : 0);
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      // Mark everything so the fields never visited also show why they failed.
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    // Stands in for the request, so the disabled/busy state is real.
    setTimeout(() => {
      this.busy.set(false);
      this.done.set(true);
    }, 1400);
  }

  useSso(provider: SsoProvider): void {
    this.sso.set(provider.label);
    // A real integration hands off to the provider here; the form is skipped
    // entirely, which is the whole point of offering it first.
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.done.set(true);
    }, 900);
  }

  reset(): void {
    this.form.reset({ updates: true, terms: false, role: '' });
    this.submitted.set(false);
    this.done.set(false);
    this.sso.set('');
  }

  /** Shared by the meter and its label, so they cannot disagree. */
  score(): number {
    const value = String(this.control('password').value ?? '');
    if (!value) return 0;
    return [
      value.length >= 12,
      /[A-Z]/.test(value),
      /[a-z]/.test(value),
      /[0-9]/.test(value),
      /[^A-Za-z0-9]/.test(value)
    ].filter(Boolean).length;
  }

  strengthLabel(): string {
    return ['Too weak', 'Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'][this.score()];
  }

  strengthBar(): string {
    return ['bg-red-600', 'bg-red-600', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'][
      this.score()
    ];
  }
}
