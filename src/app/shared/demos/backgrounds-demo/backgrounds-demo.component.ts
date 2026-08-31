import { ChangeDetectionStrategy, Component, computed, effect, input, signal, untracked } from '@angular/core';
import {
  HkAuroraComponent,
  HkBeamsComponent,
  HkDitherComponent,
  HkDotMatrixComponent,
  HkGridMotionComponent,
  HkParticleFieldComponent,
  HkSpotlightComponent,
  HkWavesComponent
} from 'hellskitchen-ui';

type BgId =
  | 'aurora'
  | 'particles'
  | 'grid'
  | 'beams'
  | 'dots'
  | 'dither'
  | 'waves'
  | 'spotlight';

/**
 * One stage, eight backgrounds. The shared controls (colour, speed, opacity)
 * are the ones every background honours; the rest are per-background and only
 * the relevant sliders render.
 */
@Component({
  selector: 'app-backgrounds-demo',
  imports: [
    HkAuroraComponent,
    HkParticleFieldComponent,
    HkGridMotionComponent,
    HkBeamsComponent,
    HkDotMatrixComponent,
    HkDitherComponent,
    HkWavesComponent,
    HkSpotlightComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './backgrounds-demo.component.html',
  styleUrl: './backgrounds-demo.component.css'
})
export class BackgroundsDemoComponent {
  readonly items: { id: BgId; label: string; hint: string }[] = [
    { id: 'aurora', label: 'Aurora', hint: 'Drifting colour fields' },
    { id: 'particles', label: 'Particle field', hint: 'Linked particles, pointer-repelled' },
    { id: 'beams', label: 'Beams', hint: 'Sweeping light' },
    { id: 'waves', label: 'Waves', hint: 'Stacked sine bands' },
    { id: 'dots', label: 'Dot matrix', hint: 'Grid that bulges toward the pointer' },
    { id: 'grid', label: 'Grid motion', hint: 'Perspective grid to a horizon' },
    { id: 'dither', label: 'Dither', hint: 'Ordered-dither bands' },
    { id: 'spotlight', label: 'Spotlight', hint: 'Light follows the pointer (CSS only)' }
  ];

  readonly palettes = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'];

  /** Set from the docs route so /docs/component/beams opens on Beams. */
  readonly slug = input('');
  readonly active = signal<BgId>('aurora');
  readonly color = signal('#dc2626');
  readonly speed = signal(1);
  readonly opacity = signal(1);
  readonly density = signal(0.9);

  readonly current = computed(() => this.items.find((i) => i.id === this.active())!);

  /** Only these two read the pointer, worth calling out in the demo. */
  readonly interactive = computed(
    () => this.active() === 'dots' || this.active() === 'spotlight' || this.active() === 'particles'
  );

  readonly showsDensity = computed(
    () => this.active() === 'particles' || this.active() === 'dots' || this.active() === 'dither'
  );

  /** Catalogue slugs differ from the internal ids for two of them. */
  private static readonly BY_SLUG: Record<string, BgId> = {
    aurora: 'aurora',
    'particle-field': 'particles',
    beams: 'beams',
    waves: 'waves',
    'dot-matrix': 'dots',
    'grid-motion': 'grid',
    dither: 'dither',
    spotlight: 'spotlight'
  };

  constructor() {
    effect(() => {
      const match = BackgroundsDemoComponent.BY_SLUG[this.slug()];
      if (match) untracked(() => this.active.set(match));
    });
  }
}
