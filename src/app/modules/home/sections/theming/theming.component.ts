import { Component, computed, signal } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface Preset {
  id: string;
  name: string;
  /** The three stops the whole preview derives from. */
  accent: string;
  accentSoft: string;
  surface: string;
  border: string;
  text: string;
}

@Component({
  selector: 'app-theming',
  imports: [RevealDirective],
  templateUrl: './theming.component.html',
  styleUrl: './theming.component.css'
})
export class ThemingComponent {
  readonly presets: Preset[] = [
    { id: 'crimson', name: 'Crimson', accent: '#dc2626', accentSoft: 'rgba(220,38,38,0.16)', surface: '#0b0b0c', border: 'rgba(255,255,255,0.10)', text: '#f5f5f5' },
    { id: 'ember',   name: 'Ember',   accent: '#f97316', accentSoft: 'rgba(249,115,22,0.16)', surface: '#0c0a09', border: 'rgba(255,255,255,0.10)', text: '#fafaf9' },
    { id: 'violet',  name: 'Violet',  accent: '#8b5cf6', accentSoft: 'rgba(139,92,246,0.16)', surface: '#0b0a12', border: 'rgba(255,255,255,0.10)', text: '#f5f3ff' },
    { id: 'teal',    name: 'Teal',    accent: '#14b8a6', accentSoft: 'rgba(20,184,166,0.16)', surface: '#08100f', border: 'rgba(255,255,255,0.10)', text: '#f0fdfa' },
    { id: 'paper',   name: 'Paper',   accent: '#111827', accentSoft: 'rgba(17,24,39,0.08)',   surface: '#f8f8f7', border: 'rgba(0,0,0,0.10)',       text: '#111827' }
  ];

  readonly radiusSteps = [
    { label: 'Sharp', value: 4 },
    { label: 'Soft', value: 12 },
    { label: 'Round', value: 24 }
  ];

  readonly presetId = signal('crimson');
  readonly radius = signal(12);
  readonly density = signal(1);

  readonly preset = computed(
    () => this.presets.find((p) => p.id === this.presetId()) ?? this.presets[0]
  );

  /** Regenerated live so the code panel always matches the preview. */
  readonly tokenCss = computed(() => {
    const p = this.preset();
    return [
      ':root {',
      `  --hk-accent: ${p.accent};`,
      `  --hk-accent-soft: ${p.accentSoft};`,
      `  --hk-surface: ${p.surface};`,
      `  --hk-border: ${p.border};`,
      `  --hk-text: ${p.text};`,
      `  --hk-radius: ${this.radius()}px;`,
      `  --hk-density: ${this.density().toFixed(2)};`,
      '}'
    ].join('\n');
  });

  readonly padding = computed(() => `${(this.density() * 0.9).toFixed(2)}rem`);

  choose(id: string): void {
    this.presetId.set(id);
  }

  setDensity(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.density.set(Number(input.value));
  }
}
