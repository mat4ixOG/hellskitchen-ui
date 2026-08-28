import { Component } from '@angular/core';

@Component({
  selector: 'app-marquee',
  imports: [],
  templateUrl: './marquee.component.html',
  styleUrl: './marquee.component.css'
})
export class MarqueeComponent {
  /** Duplicated in the template so the -50% translate loops seamlessly. */
  readonly topRow = [
    'Signals', 'Standalone APIs', 'Control flow', 'Deferrable views', 'SSR ready',
    'Zoneless', 'Tailwind v4', 'CDK friendly', 'Strict types'
  ];

  readonly bottomRow = [
    'Buttons', 'Switches', 'Tabs', 'Toasts', 'Accordions', 'Dialogs', 'Tooltips',
    'Selects', 'Steppers', 'Skeletons', 'Command palette', 'Data grid'
  ];
}
