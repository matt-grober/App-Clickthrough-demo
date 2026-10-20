# App-Clickthrough-demo
App Redesign Clickable Demo

`index.html` is a self-contained phone web app demo of the TPACTION redesign (Home, People, Chase, Events, Me,
search, notifications, turf map). All names, numbers and addresses are example data. On a phone it runs full
screen; on a desktop it shows inside a phone frame. It follows the system light/dark setting, and you can
override that in Me › Dark mode.

## Grok voice

The red mic button opens a live voice conversation with Grok. The page never holds an xAI key. Instead it
asks a Cloudflare Worker (`worker/token-worker.js`) for a short-lived voice pass, then connects to xAI with it.

**Hosting on Cloudflare (current setup):** `wrangler.jsonc` deploys one Worker, `app-clickthrough-demo`, that
serves `index.html` and answers `POST /token`. Cloudflare's GitHub build redeploys it on every push to `main`.
Set `XAI_API_KEY` as a secret in the Worker's Settings → Variables and Secrets. The page's own address is always
allowed. Add other hosts to `ALLOWED_ORIGINS` (comma-separated) only if you serve the page somewhere else.

**Worker on its own:** `worker/wrangler.toml` deploys just the token endpoint (`cd worker && npx wrangler deploy`).
Then set `TOKEN_URL` in `index.html` to that Worker's `/token` address.

The page needs HTTPS (or `localhost`) for microphone access.
