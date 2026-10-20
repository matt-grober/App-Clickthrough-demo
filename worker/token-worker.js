/**
 * TPACTION voice pass Worker
 *
 * Mints a short-lived xAI realtime client secret so the demo page can open a
 * Grok voice session without ever seeing the xAI API key.
 *
 *   POST /token  ->  { token, expires_at, model, voice }
 *
 * Environment:
 *   XAI_API_KEY        secret, required   (wrangler secret put XAI_API_KEY)
 *   ALLOWED_ORIGINS    var, required      comma-separated, e.g. "https://you.github.io,http://localhost:8080"
 *   TOKEN_TTL_SECONDS  var, optional      lifetime of each pass, default 300
 *   XAI_VOICE_MODEL    var, optional      passed to the page as ?model= on the realtime socket
 *   XAI_VOICE          var, optional      voice name for session.update, default chosen by the page
 *   TOKEN_LIMITER      binding, optional  Workers rate-limit binding, keyed by client IP
 *   ASSETS             binding, optional  static assets; set when this Worker also serves index.html
 *
 * When the page is served by this same Worker (see wrangler.jsonc at the repo
 * root), its own origin is always allowed.
 *
 * The Origin check only stops other websites from using this from a browser;
 * a script can forge Origin. Bind TOKEN_LIMITER (see wrangler.toml) or put
 * Turnstile / Access in front before sharing the link widely.
 */

const XAI_CLIENT_SECRETS_URL = "https://api.x.ai/v1/realtime/client_secrets";

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

    if (url.pathname !== "/token") {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return json({ error: "not_found" }, 404, cors);
    }
    if (request.method === "OPTIONS") return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { ...cors, Allow: "POST, OPTIONS" });
    if (!originOk) return json({ error: "origin_not_allowed" }, 403, cors);
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

    const data = await upstream.json();
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
  },
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
