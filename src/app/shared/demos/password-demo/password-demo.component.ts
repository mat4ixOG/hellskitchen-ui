import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkPasswordComponent } from 'hellskitchen-ui';

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
  imports: [HkPasswordComponent],
  template: `
    <div class="w-full max-w-sm">
      <hk-password
        [(value)]="value"
        label="Password"
        placeholder="Choose something long"
        [generate]="true" />
    </div>
  `
})
export class PasswordDemoComponent {
  readonly value = signal('');
}
