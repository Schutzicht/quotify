/* ===========================================================
   Google Indexing API - prompts Googlebot to crawl URLs fast.
   Needs a Google Cloud service account (JSON) in env GOOGLE_SA_KEY,
   with the Indexing API enabled and the service account added as
   an Owner of the property in Google Search Console.
   No external dependencies: signs the JWT with node:crypto.
   =========================================================== */

import crypto from 'crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

async function getAccessToken(sa) {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = b64url(JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/indexing',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }));
    const signature = b64url(crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(sa.private_key));
    const jwt = `${header}.${claim}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const j = await res.json();
    if (!j.access_token) throw new Error('Google token fout: ' + JSON.stringify(j).slice(0, 200));
    return j.access_token;
}

/** Notify Google that URLs were updated. opts.key = service account JSON string. */
export async function googleIndexSubmit(urls, opts = {}) {
    const raw = opts.key || process.env.GOOGLE_SA_KEY;
    if (!raw) return { ok: false, reason: 'GOOGLE_SA_KEY ontbreekt' };
    let sa;
    try { sa = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return { ok: false, reason: 'GOOGLE_SA_KEY is geen geldige JSON' }; }

    const token = await getAccessToken(sa);
    let ok = 0, fail = 0;
    for (const url of (urls || []).filter(Boolean)) {
        try {
            const r = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, type: 'URL_UPDATED' }),
            });
            if (r.ok) ok++; else fail++;
        } catch { fail++; }
    }
    return { ok: true, submitted: ok, failed: fail };
}
