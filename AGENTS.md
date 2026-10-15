# paulo-suzanne (pauloetsuzanne.com)

React Router 8 site for the restaurant, served by one Cloudflare Worker (`src/worker/Site.ts`) declared in `alchemy.run.ts`. Content and photos live in an R2 bucket (`src/worker/Bucket.ts`); the owner edits them in `/admin`. Domain words are in `CONTEXT.md`, the audience in `PRODUCT.md`.

- Gate: `bun run gate`. It never deploys.
- Requests: hashed and `public/` files are served by Cloudflare's asset layer and never reach the Worker. The Worker serves a bucket file for a path with an extension, else a React Router page (`src/server/render.ts`). Public 200s are cached at the edge under the `site` cache tag; `/admin` and anything that sets a cookie is `private, no-store`.
- Publish writes `content/site.json` and purges the `site` tag (`app/content/editor.ts`). There is no rebuild: pages read the bucket per request.
- Services (`app/services/`) are host-free `Context.Service`s. The Worker builds them from its bindings per request (`src/worker/adapters.ts`); the dev server builds them from local layers (`server.ts`).
- Dev: `bun run build && bun run dev`. The dev bucket is the folder `.data/bucket`; fill it with `scripts/copy-bucket.ts`, or set `ALLOW_DEFAULT_CONTENT=1` to see the bundled defaults.
- Deploy: `bun run plan` (prod plan), `bun run deploy` (prod, the owner's call). Secrets `ADMIN_PASSWORD` and `COOKIE_SECRET` come from `.env`. Throwaway stages: `bunx alchemy deploy alchemy.run.ts --stage agent-<topic> --yes`, then `destroy`. `bun run test:deploy` deploys, seeds, probes and destroys a `test_$USER` stage.
- Prod hosts: `PROD_HOSTS` in `src/worker/Site.ts`. `"domains"` adds zone routes for the three domains and `www`; removing them hands traffic back to whatever DNS points at.
- CPU: an uncached page render takes about 15–190 ms of CPU (measured 2026-10-15), so the account is on Workers Paid; the edge cache keeps renders rare.
- State is in the Cloudflare state store (`Cloudflare.state()`), shared by every machine.
- Lint debt: the React rules `no-array-index-key`, `set-state-in-effect`, `exhaustive-deps` and `iframe-missing-sandbox` are off for `app/` (pre-existing UI code). `app/lib/dev/**` allows `any`. Fix and re-enable them rather than adding more.
