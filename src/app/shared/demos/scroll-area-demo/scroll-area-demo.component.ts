import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HkScrollAreaComponent } from 'hellskitchen-ui';

/** Edge fades appear only when there is actually more content that way. */
@Component({
  selector: 'app-scroll-area-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkScrollAreaComponent],
  template: `
    <div class="w-full max-w-sm">
      <hk-scroll-area maxHeight="11rem" [fade]="true"
        class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950">
        <ul class="p-1">
          @for (entry of entries; track entry) {
            <li class="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5">
              <span>{{ entry }}</span>
              <span class="font-mono text-[0.72rem] text-slate-600 dark:text-gray-400">ok</span>
            </li>
          }
        </ul>
      </hk-scroll-area>
      <p class="mt-2 text-xs text-slate-600 dark:text-gray-400">Scroll — the fades track the real edges.</p>
    </div>
  `
})
export class ScrollAreaDemoComponent {
  readonly entries = Array.from({ length: 14 }, (_, index) => `probe-${String(index + 1).padStart(2, '0')} · 200 OK`);
}
