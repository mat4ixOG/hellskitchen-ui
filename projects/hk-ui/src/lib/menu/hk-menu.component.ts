import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  contentChild,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

export interface HkMenuItem {
  label: string;
  /** Shortcut or note shown on the right of a leaf. */
  hint?: string;
  /** Marks a destructive item. */
  danger?: boolean;
  /** An item with children opens a submenu instead of being chosen. */
  children?: HkMenuItem[];
}

export type HkMenuPlacement = 'bottom-start' | 'bottom-end' | 'right-start';
export type HkMenuTriggerStyle = 'icon' | 'label' | 'both';
export type HkMenuTriggerIcon = 'burger' | 'kebab';

/** Put on your own element inside `hk-menu` to use it as the trigger. */
@Directive({
  selector: '[hkMenuTrigger]',
  standalone: true,
  host: {
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'menu.open()',
    '(click)': 'menu.toggle()'
  }
})
export class HkMenuTriggerDirective {
  readonly menu = inject(HkMenuComponent);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
}

/**
 * A menu that nests. Submenus open on hover and from the keyboard, and the
 * panel flips when it would run off the viewport.
 */
@Component({
  selector: 'hk-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-menu.component.html',
  styleUrl: './hk-menu.component.css',
  host: {
    '(document:pointerdown)': 'onDocumentPointer($event)'
  }
})
export class HkMenuComponent {
  readonly items = input<HkMenuItem[]>([]);
  /** Preferred anchor; flips when it would overflow. */
  readonly placement = input<HkMenuPlacement>('bottom-start');
  readonly trigger = input<HkMenuTriggerStyle>('icon');
  /** Text for the label triggers, and the accessible name of the icon one. */
  readonly triggerLabel = input('Actions');
  readonly triggerIcon = input<HkMenuTriggerIcon>('burger');
  /** Dismisses the whole menu after a leaf is chosen. */
  readonly closeOnSelect = input(true);

  /** Emits the chosen leaf item. */
  readonly select = output<HkMenuItem>();

  readonly open = signal(false);
  /** Index of the item whose submenu is open. */
  readonly submenu = signal<number | null>(null);
  readonly flipX = signal(false);
  readonly flipY = signal(false);

  readonly customTrigger = contentChild(HkMenuTriggerDirective);
  private readonly builtInTrigger = viewChild<ElementRef<HTMLElement>>('triggerButton');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  toggle(): void {
    if (this.open()) this.close(false);
    else this.show();
  }

  show(): void {
    this.flipX.set(false);
    this.flipY.set(false);
    this.submenu.set(null);
    this.open.set(true);
    // Runs from a user event, so the browser is guaranteed; wait for the panel to render.
    setTimeout(() => {
      const panel = this.host.nativeElement.querySelector<HTMLElement>('.hk-menu-panel');
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      this.flipX.set(rect.right > window.innerWidth);
      this.flipY.set(rect.bottom > window.innerHeight);
      panel.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    });
  }

  close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.submenu.set(null);
    if (restoreFocus) this.triggerElement()?.focus();
  }

  choose(item: HkMenuItem, index: number | null = null): void {
    if (item.children?.length) {
      if (index !== null) this.submenu.set(index);
      return;
    }
    this.select.emit(item);
    if (this.closeOnSelect()) this.close();
  }

  onDocumentPointer(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close(false);
  }

  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const menu = target.closest<HTMLElement>('[role="menu"]');
    if (!menu) return;
    const entries = Array.from(
      menu.querySelectorAll<HTMLElement>(':scope > .hk-menu-entry > [role="menuitem"], :scope > [role="menuitem"]')
    );
    const current = entries.indexOf(target);
    const inSubmenu = menu.classList.contains('hk-menu-sub');

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!entries.length) return;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = current === -1 ? 0 : (current + step + entries.length) % entries.length;
        entries[next].focus();
        break;
      }
      case 'ArrowRight': {
        const index = Number(target.dataset['index']);
        if (inSubmenu || Number.isNaN(index) || !this.items()[index]?.children?.length) return;
        event.preventDefault();
        this.submenu.set(index);
        setTimeout(() =>
          target.parentElement?.querySelector<HTMLElement>('.hk-menu-sub [role="menuitem"]')?.focus()
        );
        break;
      }
      case 'ArrowLeft': {
        if (!inSubmenu) return;
        event.preventDefault();
        const parent = menu.parentElement?.querySelector<HTMLElement>(':scope > [role="menuitem"]');
        this.submenu.set(null);
        parent?.focus();
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close(false);
        break;
    }
  }

  private triggerElement(): HTMLElement | undefined {
    return this.customTrigger()?.element.nativeElement ?? this.builtInTrigger()?.nativeElement;
  }
}
