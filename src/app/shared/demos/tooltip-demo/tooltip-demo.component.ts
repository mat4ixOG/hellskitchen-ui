import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** A directive in the real library; here the four placements it supports. */
@Component({
  selector: 'app-tooltip-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid w-full max-w-xs place-items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-8">
      <div class="grid grid-cols-3 gap-2">
        <span></span>
        <button type="button" class="tip" (mouseenter)="show('top')" (mouseleave)="hide()"
          (focus)="show('top')" (blur)="hide()">top</button>
        <span></span>

        <button type="button" class="tip" (mouseenter)="show('left')" (mouseleave)="hide()"
          (focus)="show('left')" (blur)="hide()">left</button>
        <span class="grid place-items-center text-[0.72rem] text-slate-600 dark:text-gray-400">hover</span>
        <button type="button" class="tip" (mouseenter)="show('right')" (mouseleave)="hide()"
          (focus)="show('right')" (blur)="hide()">right</button>

        <span></span>
        <button type="button" class="tip" (mouseenter)="show('bottom')" (mouseleave)="hide()"
          (focus)="show('bottom')" (blur)="hide()">bottom</button>
        <span></span>
      </div>

      <p class="h-5 text-xs" [class]="active() ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-gray-400'">
        {{ active() ? 'Tooltip on the ' + active() : 'Focus or hover a button' }}
      </p>
    </div>
  `,
  styles: [`
    .tip {
      border-radius: 0.6rem;
      border: 1px solid rgb(255 255 255 / 0.1);
      background: rgb(255 255 255 / 0.03);
      padding: 0.35rem 0.5rem;
      font-size: 0.7rem;
      color: #d1d5db;
      transition: border-color 0.2s, color 0.2s;
    }
    .tip:hover, .tip:focus-visible { border-color: rgb(220 38 38 / 0.6); color: #fff; outline: none; }
  `]
})
export class TooltipDemoComponent {
  readonly active = signal('');

  show(side: string): void {
    this.active.set(side);
  }

  hide(): void {
    this.active.set('');
  }
}
