# Cloudflare Pages Functions

Anything in this directory deploys with the site — Pages picks up `functions/`
at the repo root automatically. No extra build step, no `wrangler` needed for
the normal deploy.

## `/api/views` — the visitor counter

Backed by Workers KV. **It needs a one-time binding before it does anything**;
until then it replies `503` and the footer badge stays hidden, which is the
intended behaviour rather than a bug.

### One-time setup

1. **Create the namespace.** Cloudflare dashboard → *Storage & Databases* → *KV*
   → **Create instance**. Name it `hk-views` (the name is yours; only the
   binding below has to match the code).

2. **Bind it to the Pages project.** *Workers & Pages* → your Pages project →
   *Settings* → *Bindings* → **Add** → *KV namespace*:

   | Field | Value |
   | --- | --- |
   | Variable name | `VIEWS` |
   | KV namespace | `hk-views` |

   Add it for **Production** *and* **Preview** if you want the count on preview
   deploys too. The variable name must be exactly `VIEWS` — that is what
   `views.ts` reads off `env`.

3. **Redeploy.** Bindings only attach on a new deployment; an existing one does
   not pick them up.

### Checking it

```bash
curl https://<your-site>/api/views          # { "total": 0 }
curl -X POST https://<your-site>/api/views  # { "total": 1 }
```

A `503` with `KV namespace VIEWS is not bound.` means step 2 or 3 is missing.

### Local development

`ng serve` does not run Pages Functions, so `/api/views` 404s locally and the
badge does not render. That is expected. To exercise it for real:

```bash
npm run build:site
npx wrangler pages dev dist/hk-docs/browser --kv VIEWS
```

`--kv VIEWS` gives you a local, in-memory namespace under the right name.

### Why KV and not something stronger

KV has no atomic increment and is eventually consistent, so two visits landing
in the same instant can both read `n` and both write `n+1` — the count can
under-report slightly under burst traffic. Durable Objects would be exact, but
for a vanity number on a footer the accuracy is not worth the moving parts.

The free tier allows roughly **1,000 KV writes/day** and **100,000 reads/day**.
The client only `POST`s once per browser session and `GET`s otherwise, so the
write budget tracks unique sessions rather than page views — an SPA route
change costs nothing.

## Adding real analytics (optional, also free)

The badge is a number for visitors to see; it is not analytics. For actual
traffic data, Cloudflare Web Analytics is free, unlimited and cookieless:
*Web Analytics* → add the site → paste the one `<script>` it gives you into
`src/index.html`. It needs no consent banner because it sets no cookies.
