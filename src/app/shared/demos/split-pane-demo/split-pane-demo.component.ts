import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkPaneDirective, HkSplitComponent } from 'hellskitchen-ui';

/** Drag the splitter, or focus it and use the arrow keys. */
@Component({
  selector: 'app-split-pane-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkSplitComponent, HkPaneDirective],
  template: `
    <div class="w-full max-w-md">
      <!-- Neither pane may collapse — 18% is the smallest useful width here. -->
      <hk-split [(split)]="split" [min]="18" [max]="82"
        class="h-40 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
        <div hkPane class="p-3">
          <p class="text-xs font-semibold text-slate-900 dark:text-white">Request</p>
          <pre class="mt-1.5 overflow-hidden text-[0.72rem] leading-relaxed text-slate-600 dark:text-gray-400">POST /v1/invoices
Authorization: •••
{{ '{' }} "amount": 4200 {{ '}' }}</pre>
        </div>

        <div hkPane class="p-3">
          <p class="text-xs font-semibold text-slate-900 dark:text-white">Response</p>
          <pre class="mt-1.5 overflow-hidden text-[0.72rem] leading-relaxed text-emerald-400/80">201 Created
{{ '{' }} "id": "inv_9f2" {{ '}' }}</pre>
        </div>
      </hk-split>
      <p class="mt-2 text-xs text-slate-600 dark:text-gray-400">{{ split() }}% / {{ 100 - split() }}%</p>
    </div>
  `
})
export class SplitPaneDemoComponent {
  readonly split = signal(45);
}
