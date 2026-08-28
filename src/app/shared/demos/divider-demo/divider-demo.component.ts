import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Plain, labelled and vertical — the three cases worth having. */
@Component({
  selector: 'app-divider-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-5">
      <p class="text-xs text-slate-600 dark:text-gray-400">Sign in with your work account.</p>

      <hr class="my-4 border-slate-200 dark:border-white/10" />

      <div class="my-4 flex items-center gap-3">
        <span class="h-px flex-1 bg-slate-200 dark:bg-white/10"></span>
        <span class="text-[0.72rem] uppercase tracking-wider text-slate-600 dark:text-gray-400">or</span>
        <span class="h-px flex-1 bg-slate-200 dark:bg-white/10"></span>
      </div>

      <div class="flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-gray-400">
        <span>SSO</span>
        <span class="h-4 w-px bg-slate-200 dark:bg-white/10"></span>
        <span>Magic link</span>
        <span class="h-4 w-px bg-slate-200 dark:bg-white/10"></span>
        <span>Passkey</span>
      </div>
    </div>
  `
})
export class DividerDemoComponent {}
