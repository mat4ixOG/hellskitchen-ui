import { Component, inject } from '@angular/core';
import { VisitorCountService } from '../../../shared/services/visitor-count.service';

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

interface SocialLink {
  label: string;
  icon: string;
  href: string;
}

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  private readonly visitors = inject(VisitorCountService);

  readonly year = new Date().getFullYear();

  /** Stays null until the count is actually known — see the service. */
  readonly visitorCount = this.visitors.total;

  constructor() {
    // The footer is on every page and is the only thing that shows the
    // number, so it is the natural place to ask for it.
    this.visitors.load();
  }

  /** 1,234 rather than 1234 — a bare run of digits reads as an id. */
  format(total: number): string {
    return total.toLocaleString('en-US');
  }

  readonly columns: FooterColumn[] = [
    {
      title: 'Components',
      links: [
        { label: 'Switch', href: '/docs/component/switch' },
        { label: 'Tabs', href: '/docs/component/tabs' },
        { label: 'Toast', href: '/docs/component/toast' },
        { label: 'Accordion', href: '/docs/component/accordion' },
        { label: 'Browse all →', href: '/components' }
      ]
    },
    {
      title: 'Learn',
      links: [
        { label: 'Getting started', href: '/docs/guide/getting-started' },
        { label: 'Theming tokens', href: '/docs/guide/theming' },
        { label: 'Motion system', href: '/docs/guide/motion' },
        { label: 'Accessibility', href: '/docs/guide/accessibility' },
        { label: 'Coming from PrimeNG', href: '/docs/guide/from-primeng' }
      ]
    },
    {
      title: 'Community',
      links: [
        { label: 'GitHub', href: 'https://github.com/mat4ixOG/hellskitchen-ui' },
        { label: 'Changelog', href: 'https://github.com/mat4ixOG/hellskitchen-ui/releases' }
      ]
    }
  ];

  readonly socials: SocialLink[] = [
    { label: 'GitHub', icon: 'pi pi-github', href: 'https://github.com/mat4ixOG/hellskitchen-ui' },
    { label: 'X', icon: 'pi pi-twitter', href: '#community' },
    { label: 'Discord', icon: 'pi pi-comments', href: '#community' },
    { label: 'Email', icon: 'pi pi-envelope', href: '#community' }
  ];

}
