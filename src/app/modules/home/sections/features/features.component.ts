import { Component } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { TiltDirective } from '../../../../shared/directives/tilt.directive';

interface Feature {
  icon: string;
  title: string;
  copy: string;
  /** Tailwind col-span for the bento layout. */
  span: string;
}

@Component({
  selector: 'app-features',
  imports: [RevealDirective, TiltDirective],
  templateUrl: './features.component.html',
  styleUrl: './features.component.css'
})
export class FeaturesComponent {
  readonly features: Feature[] = [
    {
      icon: 'pi pi-sliders-h',
      title: 'Configurable to the pixel',
      copy: 'Every component takes inputs for size, tone, radius, density and motion — and every one of those maps to a CSS variable you can override globally or per instance.',
      span: 'lg:col-span-2'
    },
    {
      icon: 'pi pi-bolt',
      title: 'Animation, not decoration',
      copy: 'Enter, exit and state transitions ship tuned. Nothing janks, nothing fights the router, and every motion honours prefers-reduced-motion.',
      span: ''
    },
    {
      icon: 'pi pi-box',
      title: 'Tiny by construction',
      copy: 'Standalone components, no barrel imports, no runtime theme engine. Take one and you ship one.',
      span: ''
    },
    {
      icon: 'pi pi-palette',
      title: 'Themes as plain CSS',
      copy: 'A token layer you can read. Swap the accent, radius scale or font ramp with a handful of custom properties — no SASS compile step, no preset objects to reverse-engineer.',
      span: 'lg:col-span-2'
    },
    {
      icon: 'pi pi-check-circle',
      title: 'Accessible by default',
      copy: 'Focus traps, roving tabindex, ARIA wiring and keyboard maps come built in — because a component that skips them is not finished.',
      span: ''
    },
    {
      icon: 'pi pi-heart-fill',
      title: 'Free, all of it',
      copy: 'MIT licensed, forever. No pro tier hiding the data grid, no seat count, no invoice.',
      span: ''
    },
    {
      icon: 'pi pi-code',
      title: 'Copy-paste friendly',
      copy: 'Every demo on this site ships with the exact snippet that renders it. Read it, take it, change it.',
      span: ''
    }
  ];
}
