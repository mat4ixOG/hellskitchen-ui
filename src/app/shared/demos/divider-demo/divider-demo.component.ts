import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HkDividerComponent } from 'hellskitchen-ui';

/** Plain, labelled and vertical — the three cases worth having. */
@Component({
  selector: 'app-divider-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkDividerComponent],
  template: `
    <div class="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-5">
      <p class="text-xs text-slate-600 dark:text-gray-400">Sign in with your work account.</p>

      <hk-divider />

      <hk-divider label="or" />

      <div class="flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-gray-400">
        <span>SSO</span>
        <hk-divider orientation="vertical" />
        <span>Magic link</span>
        <hk-divider orientation="vertical" />
        <span>Passkey</span>
      </div>
    </div>
  `
})
export class DividerDemoComponent {}
