import { ResolveFn, Routes } from '@angular/router';
import { COMPONENTS } from './shared/data/component-catalog';
import { GUIDES } from './shared/data/guides';
import { DEFAULT_DESCRIPTION, SITE_NAME } from './shared/data/site';

/**
 * Titles and descriptions for the parameterised routes.
 *
 * Resolvers rather than static strings, because these run during prerendering
 * too — so each of the 67 component pages and 6 guides gets its own <title>
 * and meta description baked into its HTML file. Without them every one of
 * those pages shipped the same title, which reads as duplicate content.
 */
const componentTitle: ResolveFn<string> = (route) => {
  const entry = COMPONENTS.find((c) => c.slug === route.paramMap.get('slug'));
  return entry ? `${entry.name} — Angular ${entry.name} component | ${SITE_NAME}` : SITE_NAME;
};

const componentDescription: ResolveFn<string> = (route) => {
  const entry = COMPONENTS.find((c) => c.slug === route.paramMap.get('slug'));
  if (!entry) return DEFAULT_DESCRIPTION;
  return (entry.description ?? entry.tagline).slice(0, 300);
};

const guideTitle: ResolveFn<string> = (route) => {
  const guide = GUIDES.find((g) => g.id === route.paramMap.get('id'));
  return guide ? `${guide.title} — ${SITE_NAME}` : SITE_NAME;
};

const guideDescription: ResolveFn<string> = (route) => {
  const guide = GUIDES.find((g) => g.id === route.paramMap.get('id'));
  return guide?.blurb ?? DEFAULT_DESCRIPTION;
};

const NOT_FOUND_TITLE = `Page not found — ${SITE_NAME}`;

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./modules/home/home/home.component').then((m) => m.HomeComponent),
    title: `${SITE_NAME} — free Angular component library`,
    data: { description: DEFAULT_DESCRIPTION }
  },
  {
    path: 'components',
    loadComponent: () =>
      import('./modules/catalog/catalog/catalog.component').then((m) => m.CatalogComponent),
    title: `All components — ${SITE_NAME}`,
    data: {
      description:
        'Browse every component: data table, charts, animated backgrounds, buttons, forms, ' +
        'navigation, overlays and layout. Live previews and copyable code for each one.'
    }
  },
  {
    path: 'docs',
    loadComponent: () =>
      import('./modules/docs/docs-layout/docs-layout.component').then((m) => m.DocsLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/docs/docs-home/docs-home.component').then((m) => m.DocsHomeComponent),
        title: `Documentation — ${SITE_NAME}`,
        data: {
          description:
            'Install hellskitchen-ui, import a standalone component, and theme it with CSS ' +
            'custom properties. Guides for setup, theming, motion and accessibility.'
        }
      },
      {
        path: 'guide/:id',
        loadComponent: () =>
          import('./modules/docs/guide-page/guide-page.component').then((m) => m.GuidePageComponent),
        title: guideTitle,
        resolve: { description: guideDescription }
      },
      {
        path: 'component/:slug',
        loadComponent: () =>
          import('./modules/docs/component-doc/component-doc.component').then(
            (m) => m.ComponentDocComponent
          ),
        title: componentTitle,
        resolve: { description: componentDescription }
      }
    ]
  },
  {
    // Prerendered so the build emits a real page that static hosts can serve
    // for unmatched paths (copied to /404.html after the build).
    path: '404',
    loadComponent: () =>
      import('./modules/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: NOT_FOUND_TITLE,
    data: { description: 'That page does not exist.' }
  },
  {
    // A real 404 rather than `redirectTo: ''` — that answered every bad URL with
    // the homepage on a 200, which reads as duplicate content to a crawler.
    path: '**',
    loadComponent: () =>
      import('./modules/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: NOT_FOUND_TITLE,
    data: { description: 'That page does not exist.' }
  }
];
