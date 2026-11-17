import { Component, signal, viewChild } from '@angular/core';
import { HkAccordionComponent, HkAccordionPanelComponent } from 'hellskitchen-ui';

interface Panel {
  id: string;
  header: string;
  body: string;
  /** A panel that is present but not openable — the row still reads. */
  disabled?: boolean;
}

@Component({
  selector: 'app-accordion-demo',
  imports: [HkAccordionComponent, HkAccordionPanelComponent],
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
  /** Open panel ids, two-way bound to the accordion. */
  readonly open = signal<string[]>(['free']);

  private readonly accordion = viewChild.required(HkAccordionComponent);

  setMultiple(value: boolean): void {
    // The accordion trims back to one panel itself when single mode returns.
    this.multiple.set(value);
  }

  expandAll(): void {
    this.accordion().expandAll();
  }

  collapseAll(): void {
    this.accordion().collapseAll();
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
