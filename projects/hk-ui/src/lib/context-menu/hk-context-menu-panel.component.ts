import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChildren
} from '@angular/core';

export interface HkContextMenuItem {
  label: string;
  /** Destructive items are coloured to say so. */
  danger?: boolean;
}

/** The menu `hkContextMenu` opens. Internal to the directive. */
@Component({
  selector: 'hk-context-menu-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="menu" class="hk-context-menu" [style.left.px]="x()" [style.top.px]="y()"
      (keydown)="onKeydown($event)">
      @for (item of items(); track $index) {
        <button #entry type="button" role="menuitem" class="hk-context-item"
          [class.is-danger]="item.danger" (click)="picked.emit(item)">{{ item.label }}</button>
      }
    </div>
  `,
  styleUrl: './hk-context-menu-panel.component.css'
})
export class HkContextMenuPanelComponent {
  readonly items = input<HkContextMenuItem[]>([]);
  readonly x = input(0);
  readonly y = input(0);

  readonly picked = output<HkContextMenuItem>();
  readonly dismissed = output<void>();

  private readonly entries = viewChildren<ElementRef<HTMLButtonElement>>('entry');

  constructor() {
    afterNextRender(() => this.entries()[0]?.nativeElement.focus());
  }

  onKeydown(event: KeyboardEvent): void {
    const buttons = this.entries().map((entry) => entry.nativeElement);
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        buttons[(index + 1) % buttons.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        buttons[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
        break;
      case 'Escape':
      case 'Tab':
        event.preventDefault();
        this.dismissed.emit();
        break;
    }
  }
}
