# Change log

TPACTION clickthrough demo: a phone web app for Turning Point Action volunteers, with Grok voice,
a canvassing map and an activity log. All voter names, addresses and notes are example data.

Live: https://app-clickthrough-demo.falling-dawn-6bfc.workers.dev/ (earlier versions at `/v3/`, `/v2/` and `/v1/`).
Every change below is a commit on `main`; the hash identifies its exact code change
(`https://github.com/matt-grober/App-Clickthrough-demo/commit/<hash>`).

## Fix: canvassing map under the phone's status bar (Nov 16, 2026)

Commit `fa80170`.

- Inside the app, the canvassing map no longer shows the design mockup's sample status bar ("2:03", battery 79)
  under the phone's real one, and no longer runs up beneath the real status bar. Its header, list, filter chip,
  pins and voter record moved up 38px to close the gap. Opened on its own, the map still matches the design.
- The floating voice orb on the map now sits just below the map's header. Fixed in all versions.

## Fix: search screen (Nov 16, 2026)

Commit `f33771e`.

- The search bar no longer turns into a large pink square when tapped. Its placeholder text shared a class name
  (`ph`) with the event photo tiles; it now uses its own (`sq-empty`).
- The search field shrinks so the mic button stays on screen, and search results show each name above its
  details. Fixed in all versions (`/`, `/v1/`, `/v2/`, `/v3/`).

## V4.2: "What's next" opens the voter on the map (Nov 16, 2026)

Commit `254c239`.

- When asked what to do next, where to go or who to chase, Grok must call `show_next_door` and recommend the voter
  it returns; it never names a voter or address without opening them on the map. The fixed "next door" line in
  its briefing is gone, so suggestions always come from the live walk list.
- Next door is chosen like a ballot chase: doors not worked today, unreturned ballots first, then the closest.
  If the last-used list is finished, it moves on to the next campaign with doors left.
- The voter is singled out on the map: other doors fade, their pin grows and pulses, and a "Go here next" card
  shows name, address and why, with Open (voter sheet) and Directions (Google Maps). The map's DIRECTIONS button
  also goes to them. Tapping another door or ✕ ends the single-out. Asking for a voter by name works the same way.

## V4.1: Voice reaches every campaign and can find content (Nov 16, 2026)

Commit `76d29f6`.

- **`open_campaign`**: Grok can take people to any campaign type: door walk lists; Calls (Voters Near Me,
  Maricopa ballot chase, People you know, Super Chase turnout); Texts (Voters Near Me, Needs your reply,
  Ballot reminder — Maryvale); Mail (Voters Near Me, Maryvale high-propensity, Estrella Village new registrants,
  Request supplies). It opens the campaign the way a tap does; rows that would claim or record something are
  only shown and highlighted.
- **`find_in_app`**: Grok can find feed posts, articles and videos, events, notifications, contacts, team members,
  text conversations, campaigns and today's activity by keywords, opens the right screen, scrolls to the item
  and highlights it.
- The floating voice orb is flat Cherry Red like the mic button (gray when paused).

## V4: Voice navigation (Nov 16, 2026)

Commit `a633abc`.

- **Grok can drive the app.** New voice tools: `go_to_screen` (any screen or tab), `open_walk_list` (map or list;
  "last used" is remembered on the device), `show_next_door` (the closest door not worked today, with its voter
  sheet open), `open_voter` (find a voter by name across the walk lists) and `close_walk_list`. Each tool tells
  Grok what is now on screen, e.g. the next voter's name, address, stage, ballot flag and last note.
- While Grok navigates, the voice panel shrinks to a floating orb so the screen stays visible; tap it to bring
  the panel back. On the canvassing map the orb sits in the top corner, clear of the map's buttons.
- Voice actions are logged as `voice_action`. The previous main version is kept at `/v3/`.

## Sign-in screen (Nov 16, 2026)

Commit `522c960`.

- **Sign in or sign up on every launch** (main app only; `/v1/` and `/v2/` unchanged). Required: first name,
  last name, mobile phone and ZIP code, with inline errors, automatic phone formatting and a 5-digit ZIP.
  Signing in puts the person's initials in the header and their name on Me, and Grok greets them by first name.
  For the demo it appears every time the app opens and starts empty.
- **Phone number is the primary user ID.** It is logged in full as `user_id` (`+1XXXXXXXXXX`) on the `sign_in`
  entry and on every activity entry after it; the Worker stores it in a new `user_id` column.

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
