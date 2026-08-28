import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Edge fades appear only when there is actually more content that way. */
@Component({
  selector: 'app-scroll-area-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950">
        @if (!atTop()) {
          <span class="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-white dark:from-neutral-950 to-transparent"></span>
        }
        <ul class="hk-area max-h-44 overflow-auto p-1" (scroll)="onScroll($event)">
          @for (entry of entries; track entry) {
            <li class="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5">
              <span>{{ entry }}</span>
              <span class="font-mono text-[0.72rem] text-slate-600 dark:text-gray-400">ok</span>
            </li>
          }
        </ul>
        @if (!atBottom()) {
          <span class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent"></span>
        }
      </div>
      <p class="mt-2 text-xs text-slate-600 dark:text-gray-400">Scroll — the fades track the real edges.</p>
    </div>
  `,
  styles: [`
    :host { --bar: #e2e8f0; --bar-hot: #ef4444; }
    :host-context(.dark) { --bar: #3f1010; --bar-hot: #7f1d1d; }
    .hk-area { scrollbar-width: thin; scrollbar-color: var(--bar) transparent; }
    .hk-area::-webkit-scrollbar { width: 8px; }
    .hk-area::-webkit-scrollbar-thumb { background: var(--bar); border-radius: 999px; }
    .hk-area::-webkit-scrollbar-thumb:hover { background: var(--bar-hot); }
  `]
})
export class ScrollAreaDemoComponent {
  readonly entries = Array.from({ length: 14 }, (_, index) => `probe-${String(index + 1).padStart(2, '0')} · 200 OK`);
  readonly atTop = signal(true);
  readonly atBottom = signal(false);

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    this.atTop.set(element.scrollTop <= 1);
    this.atBottom.set(element.scrollTop + element.clientHeight >= element.scrollHeight - 1);
  }
}
