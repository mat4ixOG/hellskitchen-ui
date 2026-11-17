import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { HkToastService } from './hk-toast.service';

export type HkToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'inline';

/**
 * Renders the toasts pushed through `HkToastService`. Drop one in at the app
 * root. `inline` keeps it in the normal flow instead of a screen corner.
 */
@Component({
  selector: 'hk-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-toast-host.component.html',
  styleUrl: './hk-toast-host.component.css',
  host: {
    'aria-live': 'polite',
    '[attr.data-position]': 'position()',
    '(mouseenter)': 'toast.pause()',
    '(mouseleave)': 'toast.resume()',
    '(focusin)': 'toast.pause()',
    '(focusout)': 'toast.resume()'
  }
})
export class HkToastHostComponent {
  readonly position = input<HkToastPosition>('bottom-right');
  /** Stack cap — oldest drops out first. */
  readonly max = input(3);

  protected readonly toast = inject(HkToastService);

  constructor() {
    effect(() => {
      this.toast.max = this.max();
    });
  }
}
