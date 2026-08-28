import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  signal
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

interface NavLink {
  label: string;
  /** Either a route, or a fragment on the home page. */
  route?: string;
  section?: string;
}

@Component({
  selector: 'app-header',
  imports: [ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  readonly links: NavLink[] = [
    { label: 'Home', section: 'top' },
    { label: 'Features', section: 'features' },
    { label: 'Components', route: '/components' },
    { label: 'Docs', route: '/docs' },
    { label: 'Theming', section: 'theming' },
    { label: 'Community', section: 'community' }
  ];

  /** Id of the home section in view, or '' when off the home page. */
  readonly activeSection = signal('top');
  readonly url = signal('/');
  readonly mobileOpen = signal(false);
  readonly scrolled = signal(false);
  readonly progress = signal(0);

  private spy?: IntersectionObserver;
  private pending?: ReturnType<typeof setTimeout>;
  private readonly sub: Subscription;

  constructor(private readonly router: Router) {
    this.url.set(router.url);
    this.sub = router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.url.set(event.urlAfterRedirects);
        // Sections only exist on the home page; re-attach the spy when we land there.
        this.attachSpy();
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    this.progress.set(scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0);
  }

  ngAfterViewInit(): void {
    this.attachSpy();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.spy?.disconnect();
    if (this.pending) clearTimeout(this.pending);
  }

  /** True when a link should read as current. */
  isActive(link: NavLink): boolean {
    const url = this.url();
    if (link.route) return url === link.route || url.startsWith(link.route + '/');
    return this.onHome() && this.activeSection() === link.section;
  }

  onHome(): boolean {
    const url = this.url();
    return url === '/' || url.startsWith('/#');
  }

  href(link: NavLink): string {
    return link.route ?? (this.onHome() ? '#' + link.section : '/#' + link.section);
  }

  toggleMobile(): void {
    this.mobileOpen.update((open) => !open);
  }

  select(link: NavLink): void {
    if (link.section) this.activeSection.set(link.section);
    this.mobileOpen.set(false);
  }

  private attachSpy(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.spy?.disconnect();
    this.spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.activeSection.set(entry.target.id);
        }
      },
      // Whichever section owns the middle of the viewport wins.
      { rootMargin: '-45% 0px -50% 0px' }
    );

    // Sections come from a lazy route, so wait for them to render.
    if (this.pending) clearTimeout(this.pending);
    this.pending = setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('section[id]')
        .forEach((section) => this.spy?.observe(section));
    });
  }
}
