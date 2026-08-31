import { Component } from '@angular/core';

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
  readonly year = new Date().getFullYear();

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
