/**
 * TPACTION voice pass + activity log Worker
 *
 * Mints a short-lived xAI realtime client secret so the demo page can open a
 * Grok voice session without ever seeing the xAI API key, and records what
 * people say and do in the demo.
 *
 *   POST /token  ->  { token, expires_at, model, voice }
 *   POST /log    <-  { visitor, session, name, events: [{ t, type, detail, screen }] }
 *
 * Environment:
 *   XAI_API_KEY        secret, required   (wrangler secret put XAI_API_KEY)
 *   ALLOWED_ORIGINS    var, optional      comma-separated origins allowed besides this Worker's own
 *   TOKEN_TTL_SECONDS  var, optional      lifetime of each pass, default 300
 *   XAI_VOICE_MODEL    var, optional      passed to the page as ?model= on the realtime socket
 *   XAI_VOICE          var, optional      voice name for session.update, default chosen by the page
 *   TOKEN_LIMITER      binding, optional  Workers rate-limit binding, keyed by client IP
 *   ASSETS             binding, optional  static assets; set when this Worker also serves index.html
 *   LOGS_DB            binding, optional  D1 database for the activity log. Without it, events go to
 *                                         Workers Logs (Observability) instead.
 *
 * When the page is served by this same Worker (see wrangler.jsonc at the repo
 * root), its own origin is always allowed.
 *
 * The Origin check only stops other websites from using this from a browser;
 * a script can forge Origin. Bind TOKEN_LIMITER (see wrangler.toml) or put
 * Turnstile / Access in front before sharing the link widely.
 */

const XAI_CLIENT_SECRETS_URL = "https://api.x.ai/v1/realtime/client_secrets";

const LOG_MAX_BODY = 64 * 1024;
const LOG_MAX_EVENTS = 100;
const LOG_SCHEMA =
  "CREATE TABLE IF NOT EXISTS events (" +
  "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
  "ts TEXT NOT NULL, received TEXT NOT NULL, visitor TEXT, session TEXT, name TEXT, " +
  "type TEXT NOT NULL, detail TEXT, screen TEXT, country TEXT)";
let schemaReady = null;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const originOk = allowed.includes("*") || allowed.includes(origin) || origin === url.origin;
    const cors = originOk
      ? {
          "Access-Control-Allow-Origin": allowed.includes("*") ? "*" : origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        }
      : { Vary: "Origin" };

    const route = { "/token": handleToken, "/log": handleLog }[url.pathname];
    if (!route) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return json({ error: "not_found" }, 404, cors);
    }
    if (request.method === "OPTIONS") return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { ...cors, Allow: "POST, OPTIONS" });
    if (!originOk) return json({ error: "origin_not_allowed" }, 403, cors);
    return route(request, env, cors);
  },
};

async function handleToken(request, env, cors) {
  if (!env.XAI_API_KEY) return json({ error: "server_not_configured" }, 500, cors);

  if (env.TOKEN_LIMITER) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.TOKEN_LIMITER.limit({ key: ip });
    if (!success) return json({ error: "rate_limited" }, 429, { ...cors, "Retry-After": "60" });
  }

  const ttl = clamp(parseInt(env.TOKEN_TTL_SECONDS || "300", 10) || 300, 30, 3600);

  let upstream;
  try {
    upstream = await fetch(XAI_CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_after: { seconds: ttl } }),
    });
  } catch (err) {
    console.error("xAI request failed", err);
    return json({ error: "upstream_unreachable" }, 502, cors);
  }

  if (!upstream.ok) {
    // Log the detail here; never echo xAI's response body to the browser.
    console.error("xAI client_secrets error", upstream.status, await upstream.text());
    return json({ error: "upstream_error", status: upstream.status }, 502, cors);
  }

  let data;
  try {
    data = await upstream.json();
  } catch (err) {
    console.error("xAI client_secrets response was not JSON", err);
    return json({ error: "upstream_bad_response" }, 502, cors);
  }
  const token = data.value ?? data.client_secret?.value ?? null;
  const expiresAt = data.expires_at ?? data.client_secret?.expires_at ?? null;
  if (!token) {
    console.error("xAI client_secrets response had no token", Object.keys(data));
    return json({ error: "upstream_bad_response" }, 502, cors);
  }

  return json(
    {
      token,
      expires_at: expiresAt,
      model: env.XAI_VOICE_MODEL || null,
      voice: env.XAI_VOICE || null,
    },
    200,
    cors
  );
}

async function handleLog(request, env, cors) {
  // The page sends text/plain (so sendBeacon works without a preflight); parse it as JSON.
  const raw = await request.text();
  if (raw.length > LOG_MAX_BODY) return json({ error: "too_large" }, 413, cors);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_json" }, 400, cors);
  }
  if (!body || !Array.isArray(body.events)) return json({ error: "bad_request" }, 400, cors);

  const received = new Date().toISOString();
  const visitor = cut(body.visitor, 64);
  const session = cut(body.session, 64);
  const country = request.cf?.country || null;
  const rows = body.events.slice(0, LOG_MAX_EVENTS).map((e) => ({
    ts: validTime(e?.t) || received,
    visitor,
    session,
    // Each event carries the name known when it happened; earlier events link up through session.
    name: cut(e && "name" in e ? e.name : body.name, 80),
    type: cut(e?.type, 40) || "unknown",
    detail: cut(e?.detail, 2000),
    screen: cut(e?.screen, 40),
  }));
  if (!rows.length) return json({ ok: true, stored: 0 }, 200, cors);

  if (!env.LOGS_DB) {
    for (const r of rows) console.log(JSON.stringify({ log: "tpa_event", ...r, country }));
    return json({ ok: true, stored: rows.length, store: "workers-logs" }, 200, cors);
  }

  try {
    schemaReady ??= env.LOGS_DB.prepare(LOG_SCHEMA).run();
    await schemaReady;
    const insert = env.LOGS_DB.prepare(
      "INSERT INTO events (ts, received, visitor, session, name, type, detail, screen, country) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    await env.LOGS_DB.batch(
      rows.map((r) => insert.bind(r.ts, received, r.visitor, r.session, r.name, r.type, r.detail, r.screen, country))
    );
  } catch (err) {
    schemaReady = null;
    console.error("activity log write failed", err);
    for (const r of rows) console.log(JSON.stringify({ log: "tpa_event", ...r, country }));
    return json({ ok: false, error: "store_failed" }, 500, cors);
  }
  return json({ ok: true, stored: rows.length }, 200, cors);
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function cut(v, max) {
  if (v === undefined || v === null || v === "") return null;
  return String(v).slice(0, max);
}

function validTime(t) {
  const d = new Date(t);
  return isNaN(d) ? null : d.toISOString();
}
