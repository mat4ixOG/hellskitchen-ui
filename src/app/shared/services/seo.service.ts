import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { COMPONENTS } from '../data/component-catalog';
import { GUIDES } from '../data/guides';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  REPO_URL,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  canonicalUrl
} from '../data/site';

/**
 * Sets the title, description, canonical link, social cards and JSON-LD on
 * every navigation.
 *
 * Implemented as a TitleStrategy rather than a NavigationEnd subscription so it
 * runs as part of routing itself — which means it also runs during
 * prerendering, and the tags are baked into each generated HTML file instead of
 * only appearing once JavaScript executes.
 */
@Injectable()
export class HkSeoStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot) ?? DEFAULT_TITLE;

    // The deepest route wins, so a component page can describe itself.
    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const description = (route.data['description'] as string | undefined) ?? DEFAULT_DESCRIPTION;

    // From the snapshot, not an injected Router: the Router constructs the
    // TitleStrategy, so injecting it back is a circular dependency (NG0200).
    const url = canonicalUrl(snapshot.url);

    this.titleService.setTitle(title);
    this.setTag('name', 'description', description);

    // One canonical per page, or Google picks for you.
    this.setCanonical(url);

    // A prerendered 404 is a real HTML file a crawler can reach and index.
    // It is deliberately out of the sitemap; this keeps it out of the index.
    if (route.data['noindex']) this.setTag('name', 'robots', 'noindex, follow');
    else this.removeTag("name='robots'");

    this.setTag('property', 'og:title', title);
    this.setTag('property', 'og:description', description);
    this.setTag('property', 'og:url', url);
    this.setTag('property', 'og:type', 'website');
    this.setTag('property', 'og:site_name', SITE_NAME);
    this.setTag('property', 'og:image', SITE_OG_IMAGE);

    this.setTag('name', 'twitter:card', 'summary_large_image');
    this.setTag('name', 'twitter:title', title);
    this.setTag('name', 'twitter:description', description);
    this.setTag('name', 'twitter:image', SITE_OG_IMAGE);

    this.setJsonLd(this.graphFor(route, url, title, description));
  }

  /**
   * Per-page JSON-LD.
   *
   * index.html carries the site-wide SoftwareSourceCode node; this adds what
   * only the current route knows. The BreadcrumbList matters most: it is what
   * turns the grey URL line in a result into `hellskitchen-ui.org › components
   * › Table`, and Google will not infer it from the visual breadcrumb alone.
   */
  private graphFor(
    route: ActivatedRouteSnapshot,
    url: string,
    title: string,
    description: string
  ): object | null {
    const slug = route.paramMap.get('slug');
    const guideId = route.paramMap.get('id');

    if (slug) {
      const entry = COMPONENTS.find((c) => c.slug === slug);
      if (!entry) return null;
      return {
        '@context': 'https://schema.org',
        '@graph': [
          this.breadcrumb([
            ['Components', '/components/'],
            [entry.name, `/docs/component/${entry.slug}/`]
          ]),
          {
            '@type': 'TechArticle',
            headline: `Angular ${entry.name} component`,
            description,
            url,
            // Says out loud what the page is: reference documentation for one
            // component of a named library, not a standalone article.
            about: { '@type': 'SoftwareSourceCode', name: SITE_NAME, codeRepository: REPO_URL },
            proficiencyLevel: 'Beginner',
            keywords: [`angular ${entry.name.toLowerCase()}`, ...entry.tags].join(', ')
          }
        ]
      };
    }

    if (guideId) {
      const guide = GUIDES.find((g) => g.id === guideId);
      if (!guide) return null;
      return {
        '@context': 'https://schema.org',
        '@graph': [
          this.breadcrumb([
            ['Docs', '/docs/'],
            [guide.title, `/docs/guide/${guide.id}/`]
          ]),
          { '@type': 'TechArticle', headline: guide.title, description, url }
        ]
      };
    }

    // Landing pages: breadcrumb only where there is a parent to point at.
    const path = new URL(url).pathname;
    if (path === '/components/') {
      return {
        '@context': 'https://schema.org',
        '@graph': [this.breadcrumb([['Components', '/components/']])]
      };
    }
    if (path === '/docs/') {
      return { '@context': 'https://schema.org', '@graph': [this.breadcrumb([['Docs', '/docs/']])] };
    }
    return null;
  }

  private breadcrumb(trail: [string, string][]): object {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: [['Home', '/'] as [string, string], ...trail].map(([name, path], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name,
        item: `${SITE_URL}${path}`
      }))
    };
  }

  private setJsonLd(graph: object | null): void {
    const head = this.document.head;
    // Replaced rather than appended: on a client-side navigation the previous
    // page's node would otherwise stay behind and describe the wrong URL.
    head.querySelector("script[data-hk-jsonld]")?.remove();
    if (!graph) return;

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-hk-jsonld', '');
    script.textContent = JSON.stringify(graph);
    head.appendChild(script);
  }

  private setTag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content }, `${attr}='${key}'`);
  }

  private removeTag(selector: string): void {
    this.meta.removeTag(selector);
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
