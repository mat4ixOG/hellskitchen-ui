import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { VISIBLE_GUIDES } from '../../../shared/data/guides';
import { CATEGORIES, COMPONENTS } from '../../../shared/data/component-catalog';

@Component({
  selector: 'app-docs-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './docs-layout.component.html',
  styleUrl: './docs-layout.component.css'
})
export class DocsLayoutComponent {
  readonly guides = VISIBLE_GUIDES;
  readonly categories = CATEGORIES;
  readonly components = COMPONENTS;

  /** Sidebar is a slide-over below lg. */
  readonly navOpen = signal(false);
  readonly filter = signal('');

  itemsIn(category: string) {
    const q = this.filter().trim().toLowerCase();
    return this.components.filter(
      (entry) =>
        entry.category === category &&
        (!q || entry.name.toLowerCase().includes(q) || entry.selector.toLowerCase().includes(q))
    );
  }

  setFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
  }
}
