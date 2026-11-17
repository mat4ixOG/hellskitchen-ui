import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

/** SSO providers the form knows how to draw. */
export type HkSignupProvider = 'google' | 'github' | 'microsoft' | 'apple';

/** What `(submitted)` hands over. */
export interface HkSignupValue {
  name: string;
  email: string;
  password: string;
  role: string;
  terms: boolean;
  updates: boolean;
}

const PROVIDER_LABELS: Record<HkSignupProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
  apple: 'Apple'
};

const PASSWORD_RULES: [string, (value: string) => boolean][] = [
  ['12 characters', (value) => value.length >= 12],
  ['an uppercase letter', (value) => /[A-Z]/.test(value)],
  ['a lowercase letter', (value) => /[a-z]/.test(value)],
  ['a number', (value) => /[0-9]/.test(value)],
  ['a symbol', (value) => /[^A-Za-z0-9]/.test(value)]
];

const FIELD_ORDER = ['name', 'email', 'password', 'confirm', 'role', 'terms'];

let nextId = 0;

/**
 * A signup form built the way a real one is: reactive, validated per field,
 * cross-validated for the confirm, and with SSO first.
 *
 * SSO sits above the fields, not below them, because a returning user should
 * not scan a form they are not going to fill in.
 *
 * Errors are shown on `touched || submitted`, never on every keystroke, and the
 * submit button is never disabled by invalidity: a rejected submit is what
 * surfaces every message at once.
 */
@Component({
  selector: 'hk-signup-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './hk-signup-form.component.html',
  styleUrl: './hk-signup-form.component.css'
})
export class HkSignupFormComponent {
  /** SSO buttons to offer, in order. Empty hides the block and its divider. */
  readonly providers = input<readonly HkSignupProvider[]>(['google', 'github']);
  /** Options for the role select. Empty drops the field. */
  readonly roles = input<readonly string[]>([]);
  /** How many of the five password rules must pass before the form validates. */
  readonly minPasswordScore = input(4);
  readonly requireTerms = input(true);
  readonly busy = input(false);
  /** Server-side failure, rendered above the submit as an alert. */
  readonly error = input<string | null>(null);

  /** Fires only when the form is valid. */
  readonly submitted = output<HkSignupValue>();
  /** Fires with the provider id; the form is skipped entirely. */
  readonly ssoRequested = output<string>();

  readonly attempted = signal(false);
  readonly revealed = signal(false);

  readonly id = `hk-signup-${nextId++}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly form: FormGroup = inject(FormBuilder).group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, (control: AbstractControl) => this.strength(control)]],
      confirm: ['', [Validators.required]],
      role: ['', [(control: AbstractControl) => this.roleRequired(control)]],
      terms: [false, [(control: AbstractControl) => this.termsRequired(control)]],
      updates: [true]
    },
    { validators: (group: AbstractControl) => this.passwordsMatch(group) }
  );

  constructor() {
    // The validators read inputs, so re-run them once those inputs land or change.
    effect(() => {
      this.roles();
      this.requireTerms();
      this.minPasswordScore();
      untracked(() => {
        for (const name of ['password', 'role', 'terms']) {
          this.control(name).updateValueAndValidity({ emitEvent: false });
        }
      });
    });
  }

  control(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  label(provider: HkSignupProvider): string {
    return PROVIDER_LABELS[provider] ?? provider;
  }

  /** One rule for when a message is allowed to appear. */
  showError(name: string): boolean {
    const control = this.control(name);
    return control.invalid && (control.touched || this.attempted());
  }

  /** Named errors, so the message says what to fix. */
  errorFor(name: string): string {
    const errors = this.control(name).errors ?? {};
    if (errors['server']) return errors['server'];
    // A required checkbox needs its own wording — "this field is required"
    // says nothing about a tickbox.
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
    return this.form.hasError('mismatch') && !!confirm.value && (confirm.touched || this.attempted());
  }

  /** Counts what is left, so the summary is a number and not a vague nudge. */
  invalidCount(): number {
    const failed = FIELD_ORDER.filter((name) => this.control(name).invalid).length;
    return failed + (this.form.hasError('mismatch') ? 1 : 0);
  }

  submit(): void {
    if (this.busy()) return;
    this.attempted.set(true);
    if (this.form.invalid) {
      // Mark everything so the fields never visited also show why they failed.
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      name: value.name,
      email: value.email,
      password: value.password,
      role: value.role,
      terms: !!value.terms,
      updates: !!value.updates
    });
  }

  useSso(provider: HkSignupProvider): void {
    if (this.busy()) return;
    this.ssoRequested.emit(provider);
  }

  /** Clears every control and the submitted flag. */
  reset(): void {
    this.form.reset({ name: '', email: '', password: '', confirm: '', role: '', terms: false, updates: true });
    this.attempted.set(false);
    this.revealed.set(false);
  }

  /** Attaches server messages to named controls, so a taken email lands on the email field. */
  setServerErrors(map: Record<string, string>): void {
    for (const [name, message] of Object.entries(map)) {
      const control = this.form.get(name);
      if (!control) continue;
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    }
  }

  /** Shared by the meter and its label, so they cannot disagree. */
  score(): number {
    const value = String(this.control('password').value ?? '');
    if (!value) return 0;
    return PASSWORD_RULES.filter(([, test]) => test(value)).length;
  }

  strengthLabel(): string {
    return ['Too weak', 'Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'][this.score()];
  }

  private strength(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '');
    if (!value) return null;
    const missing = PASSWORD_RULES.filter(([, test]) => !test(value)).map(([rule]) => rule);
    const score = PASSWORD_RULES.length - missing.length;
    return score >= this.minPasswordScore() ? null : { weak: { missing } };
  }

  private roleRequired(control: AbstractControl): ValidationErrors | null {
    return this.roles().length && !control.value ? { required: true } : null;
  }

  private termsRequired(control: AbstractControl): ValidationErrors | null {
    return this.requireTerms() && control.value !== true ? { required: true } : null;
  }

  /** Cross-field, so it belongs on the group. */
  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    if (!confirm) return null;
    return password === confirm ? null : { mismatch: true };
  }

  private focusFirstInvalid(): void {
    const first = FIELD_ORDER.find(
      (name) => this.control(name).invalid || (name === 'confirm' && this.form.hasError('mismatch'))
    );
    if (!first) return;
    this.host.nativeElement.querySelector<HTMLElement>(`#${this.id}-${first}`)?.focus();
  }
}
