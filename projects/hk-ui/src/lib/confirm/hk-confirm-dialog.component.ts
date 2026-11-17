import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild
} from '@angular/core';

export interface HkConfirmOptions {
  /** Headline. Ask a question. */
  title?: string;
  /** What will actually happen, and whether it can be undone. */
  body?: string;
  /** Primary button label — name the action, not "OK". */
  confirmLabel?: string;
  /** Secondary button label. */
  cancelLabel?: string;
  /** Danger restyles the confirm button. */
  tone?: 'default' | 'danger';
}

let nextConfirmId = 0;

/** The prompt `HkConfirmService.ask()` renders. Internal to the service. */
@Component({
  selector: 'hk-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hk-confirm-scrim" (click)="onScrim($event)" (keydown)="onKeydown($event)">
      <div class="hk-confirm-panel" role="alertdialog" aria-modal="true"
        [attr.aria-labelledby]="titleId" [attr.aria-describedby]="bodyId">
        <p class="hk-confirm-title" [id]="titleId">{{ options().title ?? '' }}</p>
        @if (options().body) {
          <p class="hk-confirm-body" [id]="bodyId">{{ options().body }}</p>
        }
        <div class="hk-confirm-actions">
          <button #cancel type="button" class="hk-confirm-cancel" (click)="answered.emit(false)">
            {{ options().cancelLabel ?? 'Cancel' }}
          </button>
          <button #confirm type="button" class="hk-confirm-ok" [attr.data-tone]="tone()"
            (click)="answered.emit(true)">
            {{ options().confirmLabel ?? 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './hk-confirm-dialog.component.css'
})
export class HkConfirmDialogComponent {
  readonly options = input<HkConfirmOptions>({});
  readonly answered = output<boolean>();

  readonly tone = computed(() => this.options().tone ?? 'default');
  readonly titleId = `hk-confirm-title-${nextConfirmId}`;
  readonly bodyId = `hk-confirm-body-${nextConfirmId++}`;

  private readonly cancel = viewChild.required<ElementRef<HTMLButtonElement>>('cancel');
  private readonly confirm = viewChild.required<ElementRef<HTMLButtonElement>>('confirm');

  constructor() {
    // Initial focus on the confirm button, so Enter confirms.
    afterNextRender(() => this.confirm().nativeElement.focus());
  }

  onScrim(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.answered.emit(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.answered.emit(false);
    } else if (event.key === 'Tab') {
      // Two buttons: Tab cycles between them and never leaves.
      event.preventDefault();
      const cancel = this.cancel().nativeElement;
      const confirm = this.confirm().nativeElement;
      (document.activeElement === confirm ? cancel : confirm).focus();
    }
  }
}
