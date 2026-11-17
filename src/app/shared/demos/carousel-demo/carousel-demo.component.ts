import { Component, computed, signal, viewChild } from '@angular/core';
import { HkCarouselComponent, HkCarouselSlideComponent } from 'hellskitchen-ui';

interface Slide {
  id: string;
  title: string;
  body: string;
  /** Two stops for the slide's own gradient — no image assets to ship. */
  from: string;
  to: string;
  icon: string;
}

@Component({
  selector: 'app-carousel-demo',
  imports: [HkCarouselComponent, HkCarouselSlideComponent],
  templateUrl: './carousel-demo.component.html',
  styleUrl: './carousel-demo.component.css'
})
export class CarouselDemoComponent {
  readonly slides: Slide[] = [
    { id: 'grid', title: 'Data grid', body: 'Virtual scroll, frozen columns and CSV export in one component.', from: '#dc2626', to: '#7f1d1d', icon: 'pi-table' },
    { id: 'charts', title: 'Charts', body: 'Scales and path builders, no d3 in the bundle.', from: '#2a78d6', to: '#1e3a8a', icon: 'pi-chart-line' },
    { id: 'backgrounds', title: 'Backgrounds', body: 'Eight animated canvases that pause when nobody can see them.', from: '#1baf7a', to: '#064e3b', icon: 'pi-sparkles' },
    { id: 'forms', title: 'Forms', body: 'Signal-based inputs that behave with the platform, not around it.', from: '#eb6834', to: '#7c2d12', icon: 'pi-pencil' },
    { id: 'theming', title: 'Theming', body: 'Every visual is a CSS custom property. Restyle without forking.', from: '#4a3aa7', to: '#1e1b4b', icon: 'pi-palette' }
  ];

  /** Active slide, two-way bound to the carousel. */
  readonly index = signal(0);
  readonly loop = signal(true);
  readonly autoplay = signal(true);
  /** ms between advances. Bound, so the control actually drives the timer. */
  readonly interval = signal(3200);

  readonly carousel = viewChild(HkCarouselComponent);

  /** Autoplay is on but something (hover, focus, drag) is holding it. */
  readonly paused = computed(() => this.autoplay() && this.carousel()?.playing() === false);

  chip(active: boolean): string {
    return [
      'rounded-md px-2.5 py-1 text-[0.7rem] font-semibold transition cursor-pointer',
      active
        ? 'bg-red-600 text-white'
        : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
    ].join(' ');
  }

  slideStyle(slide: Slide): string {
    return `linear-gradient(135deg, ${slide.from}, ${slide.to})`;
  }
}
