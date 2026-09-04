import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * The site's visitor count.
 *
 * Backed by `functions/api/views.ts` on Cloudflare Pages. Three things this
 * deliberately does not do:
 *
 *  • It never runs on the server. Every route here is prerendered, so a count
 *    baked in at build time would be frozen at whatever it was when the site
 *    was deployed — worse than no number at all.
 *  • It never shows a zero. If the endpoint is missing (local `ng serve`) or
 *    KV is not bound yet, `total` stays null and the badge does not render.
 *  • It counts a session, not a render. Routing between pages in this SPA is
 *    not a new visit, and the free KV tier has a write budget worth staying
 *    inside.
 */
@Injectable({ providedIn: 'root' })
export class VisitorCountService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** null until known — the badge treats null as "render nothing". */
  readonly total = signal<number | null>(null);

  private started = false;

  /** Safe to call more than once; only the first call does any work. */
  load(): void {
    if (!this.isBrowser || this.started) return;
    this.started = true;
    void this.fetchCount();
  }

  private async fetchCount(): Promise<void> {
    // A POST is a claim that this is a new visit; anything else just reads.
    const isNewSession = this.claimSession();

    try {
      const response = await fetch('/api/views', {
        method: isNewSession ? 'POST' : 'GET',
        headers: { accept: 'application/json' }
      });
      if (!response.ok) return;

      // A static host with an SPA fallback answers an unknown path with 200
      // and the index page, so `ok` alone is not proof this reached the
      // Function. Without this check the failure mode is a JSON parse error
      // caught below — same outcome, but by accident rather than on purpose.
      if (!response.headers.get('content-type')?.includes('application/json')) return;

      const body = (await response.json()) as { total?: unknown };
      const total = Number(body.total);
      if (Number.isFinite(total) && total >= 0) this.total.set(total);
    } catch {
      // Offline, blocked by an extension, or running locally without the
      // Function. None of those are worth a console error on a docs site.
    }
  }

  /** True the first time in a given browser session, false after. */
  private claimSession(): boolean {
    try {
      if (sessionStorage.getItem('hk-visit') === '1') return false;
      sessionStorage.setItem('hk-visit', '1');
      return true;
    } catch {
      // Private mode or blocked storage: read rather than write, so a browser
      // that cannot remember cannot inflate the count either.
      return false;
    }
  }
}
