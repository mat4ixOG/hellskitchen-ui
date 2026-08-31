import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./modules/home/home/home.component').then((m) => m.HomeComponent),
    title: "Hell's Kitchen UI — free Angular components"
  },
  {
    path: 'components',
    loadComponent: () =>
      import('./modules/catalog/catalog/catalog.component').then((m) => m.CatalogComponent),
    title: 'Components — Hell\'s Kitchen UI'
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
        title: 'Docs — Hell\'s Kitchen UI'
      },
      {
        path: 'guide/:id',
        loadComponent: () =>
          import('./modules/docs/guide-page/guide-page.component').then((m) => m.GuidePageComponent)
      },
      {
        path: 'component/:slug',
        loadComponent: () =>
          import('./modules/docs/component-doc/component-doc.component').then(
            (m) => m.ComponentDocComponent
          )
      }
    ]
  },
  {
    // Prerendered so the build emits a real page that static hosts can serve
    // for unmatched paths (copied to /404.html after the build).
    path: '404',
    loadComponent: () =>
      import('./modules/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Page not found — Hell\'s Kitchen UI'
  },
  {
    // A real 404 rather than `redirectTo: ''` — that answered every bad URL with
    // the homepage on a 200, which reads as duplicate content to a crawler.
    path: '**',
    loadComponent: () =>
      import('./modules/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Page not found — Hell\'s Kitchen UI'
  }
];
