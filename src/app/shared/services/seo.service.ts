import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_OG_IMAGE,
  canonicalUrl
} from '../data/site';

/**
 * Sets the title, description, canonical link and social cards on every
 * navigation.
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
  }

  private setTag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content }, `${attr}='${key}'`);
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
