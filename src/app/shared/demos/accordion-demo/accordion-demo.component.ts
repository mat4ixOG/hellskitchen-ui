import { Component, computed, signal } from '@angular/core';

interface Panel {
  id: string;
  header: string;
  body: string;
  /** A panel that is present but not openable — the row still reads. */
  disabled?: boolean;
}

@Component({
  selector: 'app-accordion-demo',
  imports: [],
  templateUrl: './accordion-demo.component.html',
  styleUrl: './accordion-demo.component.css'
})
export class AccordionDemoComponent {
  readonly panels: Panel[] = [
    {
      id: 'free',
      header: 'Is it really free?',
      body: 'MIT, every component, forever. No pro tier holding the data grid hostage.'
    },
    {
      id: 'tailwind',
      header: 'Does it need Tailwind?',
      body: 'No. Tailwind is how this site is built; the library ships plain CSS tokens you can restyle without forking anything.'
    },
    {
      id: 'versions',
      header: 'Which Angular versions?',
      body: 'Angular 19 and up — standalone components and signal inputs throughout, with SSR-safe rendering.'
    },
    {
      id: 'enterprise',
      header: 'Is there an enterprise plan?',
      body: 'Not yet — this row is here to show a disabled panel.',
      disabled: true
    }
  ];

  readonly multiple = signal(false);
  /** Open panel ids. Single mode simply never holds more than one. */
  readonly open = signal<string[]>(['free']);

  /** Only the enabled headers take part in roving focus. */
  private readonly focusable = computed(() => this.panels.filter((panel) => !panel.disabled));

  isOpen(id: string): boolean {
    return this.open().includes(id);
  }

  toggle(panel: Panel): void {
    if (panel.disabled) return;
    const isOpen = this.isOpen(panel.id);
    if (this.multiple()) {
      this.open.update((ids) => (isOpen ? ids.filter((id) => id !== panel.id) : [...ids, panel.id]));
    } else {
      // Single mode collapses everything else, and a second click closes the
      // last one — an accordion that cannot be fully closed traps the reader.
      this.open.set(isOpen ? [] : [panel.id]);
    }
  }

  setMultiple(value: boolean): void {
    this.multiple.set(value);
    // Collapsing back to single would otherwise leave several panels open at
    // once, which is exactly the state single mode is supposed to rule out.
    if (!value) this.open.update((ids) => ids.slice(0, 1));
  }

  expandAll(): void {
    this.open.set(this.focusable().map((panel) => panel.id));
    this.multiple.set(true);
  }

  collapseAll(): void {
    this.open.set([]);
  }

  /**
   * Headers behave as one widget: arrows move between them and wrap, Home and
   * End jump to the ends. Disabled headers are skipped rather than focused,
   * so the keyboard path matches what the pointer can actually reach.
   */
  onKey(event: KeyboardEvent, panel: Panel): void {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const order = this.focusable();
    const last = order.length - 1;
    const current = order.findIndex((item) => item.id === panel.id);
    if (current === -1) return;

    let next = current;
    if (event.key === 'ArrowDown') next = current === last ? 0 : current + 1;
    if (event.key === 'ArrowUp') next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;

    event.preventDefault();
    document.getElementById(`hk-acc-header-${order[next].id}`)?.focus();
  }

  chip(active: boolean): string {
    return [
      'rounded-md px-2.5 py-1 text-[0.7rem] font-semibold transition cursor-pointer',
      active
        ? 'bg-red-600 text-white'
        : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
    ].join(' ');
  }
}
