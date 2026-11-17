import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal
} from '@angular/core';

export interface HkPasswordRule {
  label: string;
  test: (value: string) => boolean;
}

/** The rule set used when `rules` is `'default'`. */
export const HK_PASSWORD_DEFAULT_RULES: HkPasswordRule[] = [
  { label: 'At least 12 characters', test: (value) => value.length >= 12 },
  { label: 'An uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'A lowercase letter', test: (value) => /[a-z]/.test(value) },
  { label: 'A number', test: (value) => /[0-9]/.test(value) },
  { label: 'A symbol', test: (value) => /[^A-Za-z0-9]/.test(value) }
];

const STRENGTHS = [
  { label: 'Too weak', tone: 'too-weak' },
  { label: 'Too weak', tone: 'too-weak' },
  { label: 'Weak', tone: 'weak' },
  { label: 'Fair', tone: 'fair' },
  { label: 'Strong', tone: 'strong' },
  { label: 'Excellent', tone: 'excellent' }
];

let nextPasswordId = 0;

/**
 * Password field with a strength meter, a live rule list and a reveal toggle.
 *
 *   • **Strength is scored from the rules, not from length.** The score is the
 *     number of satisfied rules, so the meter and the checklist cannot disagree.
 *   • **Reveal is a toggle, not a peek.** Swapping `type` keeps the caret and
 *     the value, and the button reports its state through `aria-pressed`.
 *   • **Caps Lock is a warning, not an error** — `getModifierState` knows.
 */
@Component({
  selector: 'hk-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-password.component.html',
  styleUrl: './hk-password.component.css'
})
export class HkPasswordComponent {
  /** Model value. Two-way bindable via `[(value)]`. */
  readonly value = model('');
  readonly label = input('Password');
  readonly placeholder = input('');
  readonly meter = input(true);
  readonly rules = input<'default' | HkPasswordRule[]>('default');
  readonly showRules = input(true);
  readonly toggle = input(true);
  readonly capsLockWarning = input(true);
  readonly generate = input(false);

  /** Fires with the satisfied-rule count whenever the value changes. */
  readonly scored = output<number>();
  readonly revealedChange = output<boolean>();

  readonly revealed = signal(false);
  readonly touched = signal(false);
  readonly capsOn = signal(false);

  readonly strengthId = `hk-password-${nextPasswordId++}-strength`;

  readonly ruleSet = computed(() => {
    const rules = this.rules();
    return rules === 'default' ? HK_PASSWORD_DEFAULT_RULES : rules;
  });

  /** The meter and the checklist read the same number, so they cannot drift. */
  readonly score = computed(() => this.ruleSet().filter((rule) => rule.test(this.value())).length);

  readonly bands = computed(() => this.ruleSet().map((_, index) => index + 1));

  /** Scaled onto five bands, so a custom rule set still reads on the same words. */
  readonly strength = computed(() => {
    const total = this.ruleSet().length;
    const level = total ? Math.round((this.score() * 5) / total) : 0;
    return STRENGTHS[level];
  });

  constructor() {
    effect(() => this.scored.emit(this.score()));
  }

  setRevealed(revealed: boolean): void {
    this.revealed.set(revealed);
    this.revealedChange.emit(revealed);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.toggle() && event.altKey && event.shiftKey && event.code === 'KeyV') {
      event.preventDefault();
      this.setRevealed(!this.revealed());
    }
  }

  /** The browser will not warn about Caps Lock; the event knows. */
  checkCaps(event: KeyboardEvent): void {
    this.capsOn.set(event.getModifierState?.('CapsLock') ?? false);
  }

  /** crypto.getRandomValues, not Math.random — this is a credential. */
  generatePassword(): void {
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_';
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    this.value.set([...bytes].map((byte) => alphabet[byte % alphabet.length]).join(''));
    this.setRevealed(true);
    this.touched.set(true);
  }
}
