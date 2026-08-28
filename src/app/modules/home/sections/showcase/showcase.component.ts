import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { DemoRendererComponent, DemoId } from '../../../../shared/demos/demo-renderer/demo-renderer.component';
import { COMPONENTS, ComponentEntry } from '../../../../shared/data/component-catalog';
import { FEATURED_DEMOS, isWideDemo } from '../../../../shared/demos/demo-registry';

@Component({
  selector: 'app-showcase',
  imports: [RevealDirective, DemoRendererComponent, RouterLink],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.css'
})
export class ShowcaseComponent {
  /** Every component has a demo; the homepage strip shows the curated few. */
  readonly demos: ComponentEntry[] = FEATURED_DEMOS.map(
    (slug) => COMPONENTS.find((entry) => entry.slug === slug)!
  ).filter(Boolean);
  readonly total = COMPONENTS.length;

  readonly selectedSlug = signal(this.demos[0].slug);
  readonly panel = signal<'preview' | 'code'>('preview');
  readonly copied = signal(false);

  readonly selected = computed(
    () => this.demos.find((entry) => entry.slug === this.selectedSlug()) ?? this.demos[0]
  );

  readonly snippet = computed(() => this.selected().usage ?? '');

  /** Wide demos get the stage stretched instead of centred. */
  readonly wideDemo = computed(() => isWideDemo(this.selected().slug));

  select(slug: string): void {
    this.selectedSlug.set(slug);
    this.panel.set('preview');
  }

  /**
   * Every name here must exist in the installed PrimeIcons build. A missing
   * one fails silently — the `<i>` still renders, just with no glyph — so it
   * shows up as a blank gap rather than an error. `pi-toggle-on` was exactly
   * that: a reasonable guess that PrimeIcons does not ship.
   */
  demoIcon(entry: ComponentEntry): string {
    const map: Record<string, string> = {
      table: 'pi pi-table',
      switch: 'pi pi-circle-on',
      tabs: 'pi pi-window-maximize',
      toast: 'pi pi-bell',
      'command-palette': 'pi pi-search',
      accordion: 'pi pi-list',
      rating: 'pi pi-star',
      stepper: 'pi pi-directions',
      navbar: 'pi pi-bars',
      'signup-form': 'pi pi-user-plus',
      'multi-select': 'pi pi-list-check',
      password: 'pi pi-key',
      button: 'pi pi-stop',
      'line-chart': 'pi pi-chart-line',
      'bar-chart': 'pi pi-chart-bar',
      aurora: 'pi pi-sparkles'
    };
    return map[entry.slug] ?? 'pi pi-box';
  }

  demoId(entry: ComponentEntry): DemoId {
    return entry.slug;
  }

  async copySnippet(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.snippet());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      this.copied.set(false);
    }
  }
}
