import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CATEGORIES,
  COMPONENTS,
  Category,
  ComponentEntry,
  Status
} from '../../../shared/data/component-catalog';
import { hasDemo } from '../../../shared/demos/demo-registry';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent {
  /** Every catalogue card links to a live demo; the registry is the authority. */
  readonly hasDemo = hasDemo;

  readonly categories = CATEGORIES;
  readonly statusFilters: (Status | 'All')[] = ['All', 'stable', 'new'];
  readonly all = COMPONENTS;

  readonly query = signal('');
  readonly category = signal<Category | 'All'>('All');
  readonly status = signal<Status | 'All'>('All');
  readonly dense = signal(false);

  readonly total = COMPONENTS.length;
  readonly stableCount = COMPONENTS.filter((c) => c.status === 'stable').length;
  readonly newCount = COMPONENTS.filter((c) => c.status === 'new').length;
  readonly totalSize = COMPONENTS.reduce((sum, c) => sum + c.size, 0);

  readonly filtered = computed<ComponentEntry[]>(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    const status = this.status();

    return this.all.filter((entry) => {
      if (cat !== 'All' && entry.category !== cat) return false;
      if (status !== 'All' && entry.status !== status) return false;
      if (!q) return true;

      return (
        entry.name.toLowerCase().includes(q) ||
        entry.selector.toLowerCase().includes(q) ||
        entry.tagline.toLowerCase().includes(q) ||
        entry.tags.some((tag) => tag.includes(q))
      );
    });
  });

  /** Filtered results regrouped so the page keeps its category headings. */
  readonly grouped = computed(() => {
    const list = this.filtered();
    return this.categories
      .map((category) => ({
        category,
        items: list.filter((entry) => entry.category === category)
      }))
      .filter((group) => group.items.length > 0);
  });

  countIn(category: Category): number {
    return this.all.filter((entry) => entry.category === category).length;
  }

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  reset(): void {
    this.query.set('');
    this.category.set('All');
    this.status.set('All');
  }

  statusClass(status: Status): string {
    const map: Record<Status, string> = {
      stable: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
      new: 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
    };
    return map[status];
  }

  categoryIcon(category: Category): string {
    const map: Record<Category, string> = {
      Forms: 'pi pi-pencil',
      Navigation: 'pi pi-compass',
      Feedback: 'pi pi-bell',
      Overlay: 'pi pi-clone',
      Layout: 'pi pi-th-large',
      Data: 'pi pi-database',
      Backgrounds: 'pi pi-sparkles',
      AI: 'pi pi-comments',
      Utility: 'pi pi-wrench'
    };
    return map[category];
  }
}
