# App-Clickthrough-demo
App Redesign Clickable Demo

See [CHANGELOG.md](CHANGELOG.md) for every change, version by version.

`index.html` is a self-contained phone web app demo of the TPACTION redesign (Home, People, Chase, Events, Me,
search, notifications, turf map). All names, numbers and addresses are example data. On a phone it runs full
screen; on a desktop it shows inside a phone frame. It follows the system light/dark setting, and you can
override that in Me › Dark mode.

## Versions

- `/` (`index.html` + `doors.html`): the main app (V4): sign-in on every launch, the Figma revisions, the Canvassing
  V3 map behind Chase → Doors, and a voice assistant that can navigate the app.
- `/v3/`: the previous main version (sign-in, no voice navigation).
- `/v2/`: the Figma revisions with the earlier navy canvassing map.
- `/v1/`: the original design with the earlier canvassing map.

Each version folder has its own `doors.html`. All versions share the Worker and the activity log;
`app_open` carries `v4`, `v3`, `v2` or `v1`.

## Voice navigation

Grok gets app-control tools in the second `session.update` (`go_to_screen`, `open_walk_list`, `show_next_door`,
`open_voter`, `close_walk_list`). They call `window.tpaApp` in `index.html`, which drives the app's own navigation
and asks `doors.html` for walk-list details over `postMessage` (`source: 'tpa-app'` requests, `reply` answers).

## Doors canvassing

`doors.html` is the canvassing map (voter sheet, stages, skips, voter record, contact log), kept as designed. The app
opens it full screen when someone picks a Doors campaign: Voters Near Me (`doors.html?c=vnm`), Maryvale — Turf 3
(`?c=maryvale3`) or Estrella Village — Turf 9 (`?c=estrella9`). Each campaign's example voters, notes and map street
names are in the `CAMPAIGNS` block near the end of `doors.html`; opened without `?c`, it shows the original sample
turf. Taps and results inside it go to the activity log.

## Grok voice

The red mic button opens a live voice conversation with Grok. The page never holds an xAI key. Instead it
asks a Cloudflare Worker (`worker/token-worker.js`) for a short-lived voice pass, then connects to xAI with it.

**Hosting on Cloudflare (current setup):** `wrangler.jsonc` deploys one Worker, `app-clickthrough-demo`, that
serves `index.html` and answers `POST /token`. Cloudflare's GitHub build redeploys it on every push to `main`.
Set `XAI_API_KEY` as a secret in the Worker's Settings → Variables and Secrets. The page's own address is always
allowed. Add other hosts to `ALLOWED_ORIGINS` (comma-separated) only if you serve the page somewhere else.

**Worker on its own:** `worker/wrangler.toml` deploys just the token endpoint (`cd worker && npx wrangler deploy`).
Then set `TOKEN_URL` in `index.html` to that Worker's `/token` address.

## Activity log

The app sends what people do (screens, taps, voice start/pause/end) and say (their words and Grok's replies) to
`POST /log` on the same Worker, in batches. Grok asks for the person's first name at the start of their first voice
session and saves it with a `save_name` function call; events after that carry the name, and every event carries a
per-device `visitor` ID and a per-visit `session` ID. After the sign-in screen, every event also carries `user_id`: the person's phone number in
`+1XXXXXXXXXX` form, the primary user ID.

Events are stored in the D1 database bound as `LOGS_DB` (table `events`, created automatically). Without that
binding the Worker writes each event to Workers Logs instead (Observability, search for `tpa_event`).

To read them: Cloudflare dashboard → Storage & databases → D1 → the database → Console, e.g.
`SELECT ts, name, type, detail, screen FROM events ORDER BY id DESC LIMIT 200;`

The page needs HTTPS (or `localhost`) for microphone access.
