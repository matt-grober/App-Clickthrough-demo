# App-Clickthrough-demo
App Redesign Clickable Demo

`index.html` is a self-contained phone web app demo of the TPACTION redesign (Home, People, Chase, Events, Me,
search, notifications, turf map). All names, numbers and addresses are example data. On a phone it runs full
screen; on a desktop it shows inside a phone frame. It follows the system light/dark setting, and you can
override that in Me › Dark mode.

## Grok voice

The red mic button opens a live voice conversation with Grok. The page never holds an xAI key. Instead it
asks a Cloudflare Worker (`worker/token-worker.js`) for a short-lived voice pass, then connects to xAI with it.

1. `cd worker && npx wrangler secret put XAI_API_KEY`
2. In `worker/wrangler.toml`, set `ALLOWED_ORIGINS` to the origin(s) hosting `index.html`.
3. `npx wrangler deploy`
4. In `index.html`, set `TOKEN_URL` to `https://<worker>.workers.dev/token`.

The page needs HTTPS (or `localhost`) for microphone access.
