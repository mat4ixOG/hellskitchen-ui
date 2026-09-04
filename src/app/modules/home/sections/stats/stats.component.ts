import { Component } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';
import { COMPONENTS } from '../../../../shared/data/component-catalog';

interface Stat {
  value: number;
  decimals: number;
  suffix: string;
  label: string;
  note: string;
}

@Component({
  selector: 'app-stats',
  imports: [RevealDirective, CountUpDirective],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent {
  readonly stats: Stat[] = [
    { value: COMPONENTS.length, decimals: 0, suffix: '', label: 'Components', note: 'and none of them paywalled' },
    { value: 3.4, decimals: 1, suffix: ' kB', label: 'Median size', note: 'gzipped, per component' },
    { value: 100, decimals: 0, suffix: '%', label: 'Free', note: 'MIT, no pro edition' },
    { value: 0, decimals: 0, suffix: '', label: 'Runtime deps', note: 'Angular and nothing else' }
  ];

  readonly quotes = [
    {
      body: 'Swapped four PrimeNG imports for these and the bundle dropped 60 kB. The switch alone was worth it.',
      name: 'Aditi R.',
      role: 'Frontend lead, fintech'
    },
    {
      body: 'First component library where reading the source was faster than reading the docs. That is the compliment.',
      name: 'Marco B.',
      role: 'Angular consultant'
    },
    {
      body: 'Theming took one afternoon. Seven custom properties and our design system was in.',
      name: 'Sam O.',
      role: 'Design engineer'
    }
  ];
}
