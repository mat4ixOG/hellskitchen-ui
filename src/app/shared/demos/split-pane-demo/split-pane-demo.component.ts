import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';

/** Drag the splitter, or focus it and use the arrow keys. */
@Component({
  selector: 'app-split-pane-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-md">
      <div class="flex h-40 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
        <div class="overflow-hidden p-3" [style.width.%]="split()">
          <p class="text-xs font-semibold text-slate-900 dark:text-white">Request</p>
          <pre class="mt-1.5 overflow-hidden text-[0.72rem] leading-relaxed text-slate-600 dark:text-gray-400">POST /v1/invoices
Authorization: •••
{{ '{' }} "amount": 4200 {{ '}' }}</pre>
        </div>

        <div role="separator" tabindex="0" aria-orientation="vertical"
          [attr.aria-valuenow]="split()"
          class="group w-1.5 shrink-0 cursor-col-resize bg-slate-100 dark:bg-white/[0.06] transition-colors hover:bg-red-700/60 focus-visible:bg-red-600 focus-visible:outline-none"
          (pointerdown)="start($event)" (keydown)="onKey($event)"></div>

        <div class="flex-1 overflow-hidden p-3">
          <p class="text-xs font-semibold text-slate-900 dark:text-white">Response</p>
          <pre class="mt-1.5 overflow-hidden text-[0.72rem] leading-relaxed text-emerald-400/80">201 Created
{{ '{' }} "id": "inv_9f2" {{ '}' }}</pre>
        </div>
      </div>
      <p class="mt-2 text-xs text-slate-600 dark:text-gray-400">{{ split() }}% / {{ 100 - split() }}%</p>
    </div>
  `
})
export class SplitPaneDemoComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly split = signal(45);

  start(event: PointerEvent): void {
    event.preventDefault();
    const track = (event.currentTarget as HTMLElement).parentElement!;
    const rect = track.getBoundingClientRect();

    const move = (move: PointerEvent): void => {
      const percent = ((move.clientX - rect.left) / rect.width) * 100;
      // Neither pane may collapse — 18% is the smallest useful width here.
      this.split.set(Math.min(82, Math.max(18, Math.round(percent))));
    };
    const stop = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }

  onKey(event: KeyboardEvent): void {
    const step = event.key === 'ArrowLeft' ? -4 : event.key === 'ArrowRight' ? 4 : 0;
    if (!step) return;
    event.preventDefault();
    this.split.set(Math.min(82, Math.max(18, this.split() + step)));
  }
}
