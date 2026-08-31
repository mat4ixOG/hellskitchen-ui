import { RenderMode, ServerRoute } from '@angular/ssr';
import { COMPONENTS } from './shared/data/component-catalog';
import { GUIDES } from './shared/data/guides';

/**
 * Which routes get rendered to HTML at build time, and how the parameterised
 * ones enumerate themselves.
 *
 * The params come straight from the data that drives the pages, so adding a
 * component to the catalogue prerenders its docs page without anyone
 * remembering to update a list.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'docs/component/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => COMPONENTS.map((entry) => ({ slug: entry.slug }))
  },
  {
    path: 'docs/guide/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => GUIDES.map((guide) => ({ id: guide.id }))
  },
  { path: '**', renderMode: RenderMode.Prerender }
];
