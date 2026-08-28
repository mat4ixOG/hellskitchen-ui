import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-accordion-demo',
  imports: [],
  templateUrl: './accordion-demo.component.html',
  styleUrl: './accordion-demo.component.css'
})
export class AccordionDemoComponent {
  readonly items = [
    { q: 'Is it really free?', a: 'MIT, every component, forever. No pro tier holding the data grid hostage.' },
    { q: 'Does it need Tailwind?', a: 'No. Tailwind is how this site is built; the library ships plain CSS tokens.' },
    { q: 'Which Angular versions?', a: 'Angular 19 and up — standalone components and signal inputs throughout.' }
  ];

  readonly open = signal<number | null>(0);

  toggle(index: number): void {
    this.open.update((current) => (current === index ? null : index));
  }
}
