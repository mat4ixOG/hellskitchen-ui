import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  contentChild,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';

export type HkDialogSize = 'sm' | 'md' | 'lg';

let nextDialogTitleId = 0;

/** Marks the dialog's heading; the panel is labelled by it. */
@Directive({
  selector: '[hkDialogTitle]',
  standalone: true,
  host: { class: 'hk-dialog-title', '[id]': 'id' }
})
export class HkDialogTitleDirective {
  readonly id = `hk-dialog-title-${nextDialogTitleId++}`;
}

/** The supporting line under the title. */
@Directive({
  selector: '[hkDialogBody]',
  standalone: true,
  host: { class: 'hk-dialog-body' }
})
export class HkDialogBodyDirective {}

/**
 * Modal built on the native `<dialog>`, so focus trapping, Escape, the inert
 * page behind and the top layer all come from the platform.
 */
@Component({
  selector: 'hk-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-dialog.component.html',
  styleUrl: './hk-dialog.component.css'
})
export class HkDialogComponent {
  /** Clicking the backdrop dismisses. */
  readonly closeOnBackdrop = input(true);
  readonly size = input<HkDialogSize>('md');

  /** The return value, or "dismissed" when closed without one. */
  readonly closed = output<string>();

  private readonly box = viewChild.required<ElementRef<HTMLDialogElement>>('box');
  private readonly title = contentChild(HkDialogTitleDirective);
  readonly labelledBy = computed(() => this.title()?.id ?? null);

  open(): void {
    const dialog = this.box().nativeElement;
    dialog.returnValue = '';
    if (!dialog.open) dialog.showModal();
  }

  close(value?: string): void {
    const dialog = this.box().nativeElement;
    if (dialog.open) dialog.close(value);
  }

  onClose(): void {
    this.closed.emit(this.box().nativeElement.returnValue || 'dismissed');
  }

  /** The panel has no padding of its own, so a click on the element itself is the backdrop. */
  onClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === this.box().nativeElement) this.close();
  }
}

/** A button that closes the dialog, returning its `value`. */
@Directive({
  selector: '[hkDialogClose]',
  standalone: true,
  host: { class: 'hk-dialog-action', type: 'button', '(click)': 'dialog?.close(value() || undefined)' }
})
export class HkDialogCloseDirective {
  readonly value = input('');
  protected readonly dialog = inject(HkDialogComponent, { optional: true });
}
