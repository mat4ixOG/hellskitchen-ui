import { DOCUMENT } from '@angular/common';
import {
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  ViewContainerRef,
  inject,
  input,
  output
} from '@angular/core';
import { HkContextMenuItem, HkContextMenuPanelComponent } from './hk-context-menu-panel.component';

/**
 * Right-click menu on any element. The panel is clamped inside the host, so it
 * never opens half off its container. Shift+F10 and the Menu key open it from
 * the keyboard.
 */
@Directive({
  selector: '[hkContextMenu]',
  standalone: true,
  host: {
    '(contextmenu)': 'onContextMenu($event)',
    '(keydown)': 'onKeydown($event)'
  }
})
export class HkContextMenuDirective {
  /** Items to show. */
  readonly items = input<HkContextMenuItem[]>([], { alias: 'hkContextMenu' });
  /** Falls back to the browser menu. */
  readonly disabled = input(false);
  /** Emits the chosen item. */
  readonly menuSelect = output<HkContextMenuItem>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly vcr = inject(ViewContainerRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private panel: ComponentRef<HkContextMenuPanelComponent> | null = null;
  private stopOutside: (() => void) | null = null;

  constructor() {
    // Reachable from the keyboard, or the menu key has nothing to act on.
    const element = this.host.nativeElement;
    if (!element.hasAttribute('tabindex')) this.renderer.setAttribute(element, 'tabindex', '0');
    inject(DestroyRef).onDestroy(() => this.close(false));
  }

  onContextMenu(event: MouseEvent): void {
    if (this.disabled() || !this.items().length) return;
    event.preventDefault();
    this.open(event.clientX, event.clientY);
  }

  onKeydown(event: KeyboardEvent): void {
    const menuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
    if (!menuKey || event.target !== this.host.nativeElement) return;
    if (this.disabled() || !this.items().length) return;
    event.preventDefault();
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.open(rect.left + 8, rect.top + 8);
  }

  close(restoreFocus = true): void {
    this.stopOutside?.();
    this.stopOutside = null;
    if (!this.panel) return;
    this.panel.destroy();
    this.panel = null;
    if (restoreFocus) this.host.nativeElement.focus();
  }

  private open(clientX: number, clientY: number): void {
    this.close(false);
    const ref = this.vcr.createComponent(HkContextMenuPanelComponent);
    ref.setInput('items', this.items());
    ref.instance.picked.subscribe((item) => {
      this.close();
      this.menuSelect.emit(item);
    });
    ref.instance.dismissed.subscribe(() => this.close());
    ref.changeDetectorRef.detectChanges();
    this.panel = ref;

    // Clamp to the host, measured now that the panel has a size.
    const menu = (ref.location.nativeElement as HTMLElement).firstElementChild as HTMLElement | null;
    const bounds = this.host.nativeElement.getBoundingClientRect();
    const width = menu?.offsetWidth ?? 0;
    const height = menu?.offsetHeight ?? 0;
    ref.setInput('x', Math.max(bounds.left, Math.min(clientX, bounds.right - width)));
    ref.setInput('y', Math.max(bounds.top, Math.min(clientY, bounds.bottom - height)));
    ref.changeDetectorRef.detectChanges();

    this.stopOutside = this.renderer.listen(this.document, 'pointerdown', (event: Event) => {
      if (!menu?.contains(event.target as Node)) this.close(false);
    });
  }
}
