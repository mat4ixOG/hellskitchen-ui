/**
 * Visitor counter — a Cloudflare Pages Function backed by Workers KV.
 *
 * Runs on the free tier and needs no third-party account: Pages already hosts
 * the site, and Functions in this directory deploy with it. One KV namespace
 * has to be bound as `VIEWS` in the Pages project (see README-analytics.md) —
 * until it is, this replies 503 and the badge simply does not render, rather
 * than the page showing a broken zero.
 *
 * Free-tier KV allows ~1,000 writes/day, so a write per page load would run
 * out by mid-morning on a good day. The client only POSTs once per browser
 * session; every other render is a GET, and reads are effectively unlimited
 * (100k/day).
 */

interface Env {
  VIEWS?: KVNamespace;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Context {
  request: Request;
  env: Env;
}

const KEY = 'total';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // The count is allowed to be a few seconds stale; what matters is that
      // a CDN edge does not pin it for an hour.
      'cache-control': 'no-store'
    }
  });

export const onRequestGet = async ({ env }: Context): Promise<Response> => {
  if (!env.VIEWS) return json({ error: 'KV namespace VIEWS is not bound.' }, 503);
  const raw = await env.VIEWS.get(KEY);
  return json({ total: Number(raw ?? 0) });
};

export const onRequestPost = async ({ env }: Context): Promise<Response> => {
  if (!env.VIEWS) return json({ error: 'KV namespace VIEWS is not bound.' }, 503);

  const raw = await env.VIEWS.get(KEY);
  const next = Number(raw ?? 0) + 1;

  // KV is eventually consistent and has no atomic increment, so two visits
  // landing in the same instant can read the same value and both write n+1.
  // For a vanity counter that is an acceptable trade against the complexity
  // of Durable Objects; it under-counts slightly under burst traffic and is
  // never wrong by more than the concurrency.
  await env.VIEWS.put(KEY, String(next));

  return json({ total: next });
};

/** Anything else is not a thing this endpoint does. */
export const onRequest = async ({ request }: Context): Promise<Response> => {
  if (request.method === 'GET' || request.method === 'POST') {
    // Handled by the verb-specific exports above; Pages only falls through to
    // this for other methods.
    return json({ error: 'Unhandled.' }, 500);
  }
  return json({ error: `${request.method} not allowed.` }, 405);
};
