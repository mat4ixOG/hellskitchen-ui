import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HkSignupFormComponent,
  type HkSignupProvider,
  type HkSignupValue
} from 'hellskitchen-ui';

const PROVIDER_NAMES: Record<HkSignupProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
  apple: 'Apple'
};

/**
 * The library's `hk-signup-form`, with the request faked: the page owns the
 * busy flag and the success state, the form owns validation and SSO.
 */
@Component({
  selector: 'app-signup-form-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkSignupFormComponent],
  templateUrl: './signup-form-demo.component.html'
})
export class SignupFormDemoComponent {
  readonly providers: HkSignupProvider[] = ['google', 'github', 'microsoft', 'apple'];
  readonly roles = ['Engineering', 'Design', 'Product', 'Operations', 'Other'];

  readonly busy = signal(false);
  readonly done = signal(false);
  readonly sso = signal('');
  readonly email = signal('');

  register(value: HkSignupValue): void {
    this.email.set(value.email);
    this.busy.set(true);
    // Stands in for the request, so the disabled/busy state is real.
    setTimeout(() => {
      this.busy.set(false);
      this.done.set(true);
    }, 1400);
  }

  useSso(provider: string): void {
    this.sso.set(PROVIDER_NAMES[provider as HkSignupProvider] ?? provider);
    // A real integration hands off to the provider here; the form is skipped
    // entirely, which is the whole point of offering it first.
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.done.set(true);
    }, 900);
  }

  reset(): void {
    this.done.set(false);
    this.sso.set('');
    this.email.set('');
  }
}
