# Change log

TPACTION clickthrough demo: a phone web app for Turning Point Action volunteers, with Grok voice,
a canvassing map and an activity log. All voter names, addresses and notes are example data.

Live: https://app-clickthrough-demo.falling-dawn-6bfc.workers.dev/ (older designs at `/v2/` and `/v1/`).
Every change below is a commit on `main`; the hash links each entry to its exact code change.

## V3: Canvassing V3 map is the main version (Oct 27, 2026)

- `fa07e2c` **V3 becomes the main app.** The previous main version moves to `/v2/` with its own copy of the
  earlier map; `/v1/` keeps the original design and its map; `/v3/` redirects to `/`.
- `5746660` **Canvassing V3 map behind Chase → Doors**, from the "TPACTION Canvassing V3" artifact:
  Montserrat, brand-blue (`#3667F6`) header and buttons, 14 new stage colors, green (`#25A53A`) talked and
  red (`#EB4035`) tried marks, red NOT HOME and yellow SKIP buttons, brand-colored skip reasons, a solid
  TALK TO button and a blue household line when more than one voter lives at an address.

## V2: Figma revisions (Oct 27, 2026)

- `3568695` **Figma revisions published as the main app; flat voice mic.** The mic button is flat Cherry Red
  (`#E53268`) and the voice-screen orb is flat brand blue / cherry / gray instead of gradients.
- `3399eab` **Figma revisions** (built first as a separate version):
  - Montserrat everywhere; screen titles, tabs and nav labels in small caps; "TURNING POINT ACTION" on Home.
  - Superfeed brand colors: Cherry Red `#E53268` badges and alerts, solid Dark Blue `#03129C` avatars,
    `#3667F6` tab underlines, selected chips and primary buttons (rounder corners).
  - Chase button: solid `#3667F6`, no white ring, lightning-bolt icon; turns `#9AFCFD` when Chase is active.
  - Channel colors: Doors `#3667F6`, Calls `#E53268`, Texts `#03129C`, Postcards `#9AFCFD`, Streak `#F3B85C`.
  - Pills and tags as colored text on a light tint (Chase pink, Ask yellow, Done/Talk blue).
  - Home impact box solid blue with aqua text; Connect "best list" card blue with `#69A6FA` boxes;
    Republican categories may use red `#EB4035`.
  - Events: category tags (CANVASS, PHONE BANK, TRAINING, RALLY), blue RSVP.
  - Event detail: blue-to-dark-blue hero, cherry "Happening now", gray Directions, dark-blue group total,
    black video area with the caption above, yellow heat-advisory icon, mint online dots.

## Canvassing map (Oct 20–22, 2026)

- `9d57ac7` **Map updated to the latest design:** campaign header with back button, Map/List switch and
  progress bar; sortable, searchable door list with returned-ballot flags; swipe-down sheets.
- `a3164a0` **Doors canvassing map added** (`doors.html`), opened full screen from Chase → Doors, with example
  data for Voters Near Me, Maryvale — Turf 3 and Estrella Village — Turf 9. Replaced a placeholder map screen.

## Voice and activity log (Oct 20, 2026)

- `830b192` **Grok asks for the user's first name** (saved with a `save_name` function call, remembered for the
  visit) and **the app logs what people say and do**: their words, Grok's replies, screens, taps, voice
  start/pause/end. Events go in batches to `POST /log` on the Worker. The voice screen says the demo records
  conversations and taps.
- `171e009` **Voice pauses after 8 seconds of quiet** so an open line isn't billed while nobody talks. The clock
  stops while the user speaks or Grok replies; tapping the orb reconnects.
- `84df82f` Error messages now show the Worker's reason (e.g. `server_not_configured`, `upstream_error 401`).

## Hosting (Oct 20, 2026)

- `a919efd` Removed a local test cache that was committed by mistake.
- `0210876` **One Cloudflare Worker serves the page and the voice pass.** Cloudflare's GitHub build was
  redeploying the Worker as static files only, so `/token` returned 404; `wrangler.jsonc` now deploys both.
- `ace8ce6` Page pointed at the deployed Worker.

## First version (Oct 20, 2026)

- `b631b8d` **Phone web app built** from the "TPACTION — Home Redesign v8" artifact (Home, People, Chase,
  Events, Me, search, notifications) as a native-feeling full-screen app with example data, plus a big mic
  button for a Grok realtime voice conversation. The Worker (`worker/token-worker.js`) mints short-lived
  voice passes so the xAI key never reaches the page.
- `b97f0bf` Repository created.
