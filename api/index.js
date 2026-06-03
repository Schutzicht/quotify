import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Auto-blog engine (static imports so Vercel bundles them with the function)
import autoTopics from '../content/blog/_topics.mjs';
import { generatePostObject } from '../scripts/lib/ai-writer.mjs';
import { serializePost } from '../scripts/lib/post-file.mjs';
import { blogSlugsOnGithub, commitPostDirect, recentBlogCommits } from '../scripts/lib/github.mjs';
import { indexNowSubmit } from '../scripts/lib/indexnow.mjs';

dotenv.config();

const SITE_URL = 'https://offertje.nl';

// Notify search engines about new/updated URLs (fire and forget).
async function pingSearchEngines(urls) {
    try { await indexNowSubmit(urls); } catch { /* ignore */ }
    if (process.env.GOOGLE_SA_KEY) {
        try {
            const { googleIndexSubmit } = await import('../scripts/lib/google-index.mjs');
            await googleIndexSubmit(urls);
        } catch { /* ignore */ }
    }
}

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// Middleware
// We need raw body for webhooks, JSON for others
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/webhooks')) {
        next();
    } else {
        // 6mb so an offerte with a base64 logo + signature fits.
        express.json({ limit: '6mb' })(req, res, next);
    }
});

app.use(cors());

// --- ROUTES ---

// 1. Create Payment Intent/Session
// Renamed from create-checkout-session to match frontend expectation or updated frontend to match this.
// Plan said: Rename route `/api/create-checkout-session` to `/api/create-payment`
app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount } = req.body;

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: { name: 'Offerte Betaling' },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            payment_method_types: ['card', 'ideal'],
            return_url: `${req.headers.origin || 'http://localhost:5173'}/app?session_id={CHECKOUT_SESSION_ID}`,
        });

        res.json({ clientSecret: session.client_secret });
    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 1b. Generate the PDF SERVER-SIDE, only after verifying the payment.
//     This is the only place a clean (watermark-free) PDF is produced, so the
//     paywall can't be bypassed by the client. The offerte data is posted by
//     the client; we just check that the Stripe session is actually paid.
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { sessionId, state } = req.body || {};
        if (!sessionId || !state || !Array.isArray(state.items)) {
            return res.status(400).json({ error: 'sessionId en state zijn vereist.' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session || session.payment_status !== 'paid') {
            return res.status(402).json({ error: 'Betaling niet gevonden of nog niet voltooid.' });
        }

        // Load the PDF engine lazily so other API routes stay lightweight.
        const { jsPDF } = await import('jspdf');
        const { buildPdf, pdfFilename } = await import('../src/js/pdf-gen.js');
        const doc = buildPdf(state, jsPDF);
        const buf = Buffer.from(doc.output('arraybuffer'));
        const safeName = (pdfFilename(state) || 'Offerte.pdf').replace(/[^\w\d.\- ]+/g, '').trim() || 'Offerte.pdf';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        return res.status(200).send(buf);
    } catch (err) {
        console.error('generate-pdf error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// 2. Webhook Endpoint
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // In a real scenario, use process.env.STRIPE_WEBHOOK_SECRET
        // For now, we trust the event or use a placeholder if not set
        // NOTE: Without the real CLI secret, signature verification fails locally usually.
        // We will just try-catch standard verification.
        if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_placeholder_secret') {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } else {
            // Dev Mode bypass (User requested simple endpoint existence)
            // Warning: Unsafe for production
            try {
                event = JSON.parse(req.body.toString());
            } catch (e) {
                event = req.body;
            }
        }
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('💰 Payment Received!');
        console.log(`Session ID: ${session.id}`);
        // Here you would update your database (e.g. set user as paid)
    }

    res.send();
});

// ---- Auto-blog: shared generate + publish helper ----
const ghEnv = () => ({
    token: process.env.GITHUB_TOKEN,
    groqKey: process.env.GROQ_API_KEY,
    owner: process.env.GITHUB_OWNER || 'Schutzicht',
    repo: process.env.GITHUB_REPO || 'quotify',
    base: process.env.GITHUB_BASE || 'main',
});

async function generateAndPublishNext() {
    const { token, groqKey, owner, repo, base } = ghEnv();
    if (!token) throw new Error('GITHUB_TOKEN ontbreekt');
    if (!groqKey) throw new Error('GROQ_API_KEY ontbreekt');

    // Source of truth for "what already exists" is the repo itself.
    const taken = await blogSlugsOnGithub(token, owner, repo);
    const topic = autoTopics.find((t) => t && t.slug && !taken.has(t.slug));
    if (!topic) return { status: 'leeg', message: 'Geen onderwerpen meer in de wachtrij.' };

    const post = await generatePostObject(topic, { apiKey: groqKey, slugList: [...taken] });
    post.date = new Date().toISOString().slice(0, 10);
    post.updated = post.date;
    const commit = await commitPostDirect({
        token, owner, repo, branch: base, slug: post.slug, fileContent: serializePost(post),
    });
    // Tell search engines about the new article right away.
    await pingSearchEngines([`${SITE_URL}/blog/${post.slug}/`, `${SITE_URL}/sitemap.xml`, `${SITE_URL}/blog/`]);
    return { status: 'ok', slug: post.slug, title: post.title, commit };
}

// 3. Auto-blog cron: generate the next queued post and publish it directly.
//    Scheduled in vercel.json. Needs env: GROQ_API_KEY, GITHUB_TOKEN (optional CRON_SECRET).
app.get('/api/cron/generate-blog', async (req, res) => {
    if (process.env.CRON_SECRET && (req.headers.authorization || '') !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    try {
        return res.json(await generateAndPublishNext());
    } catch (e) {
        console.error('Auto-blog cron error:', e);
        return res.status(500).json({ error: e.message });
    }
});

// ---- Admin dashboard API ----
// Password comes from env (the repo is public, so it must NOT live in code).
// Falls back to CRON_SECRET so it keeps working if ADMIN_PASSWORD is unset.
// Email is just a username and may live in code (env override possible).
const adminSecret = () => process.env.ADMIN_PASSWORD || process.env.CRON_SECRET || '';
const adminEmail = () => (process.env.ADMIN_EMAIL || 'jorik@agensea.nl').trim().toLowerCase();
function adminOk(req) {
    const secret = adminSecret();
    if (!secret) return false;
    const key = req.headers['x-admin-key']
        || (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
        || (req.body && req.body.password);
    return key === secret;
}

app.post('/api/admin/login', (req, res) => {
    if (!adminSecret()) return res.status(503).json({ error: 'Stel ADMIN_PASSWORD in (Vercel env).' });
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const password = (req.body && req.body.password) || '';
    if (email === adminEmail() && password === adminSecret()) return res.json({ ok: true });
    return res.status(401).json({ ok: false, error: 'Onjuiste e-mail of wachtwoord' });
});

app.get('/api/admin/status', async (req, res) => {
    if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
    const { token, owner, repo } = ghEnv();
    const PREFIX = 'content: auto-blog ';
    try {
        let taken = new Set();
        let commits = [];
        if (token) {
            taken = await blogSlugsOnGithub(token, owner, repo);
            commits = await recentBlogCommits(token, owner, repo, 20);
        }
        const auto = commits
            .filter((c) => c.message.startsWith(PREFIX))
            .map((c) => ({ slug: c.message.slice(PREFIX.length).trim(), date: c.date, url: c.url }));
        const today = new Date().toISOString().slice(0, 10);
        return res.json({
            ok: true,
            ranToday: auto.some((a) => (a.date || '').slice(0, 10) === today),
            latest: auto[0] || null,
            recent: auto.slice(0, 8),
            published: taken.size,
            queueLeft: autoTopics.filter((t) => !taken.has(t.slug)).length,
            totalTopics: autoTopics.length,
            hasGithub: !!token,
            hasGroq: !!process.env.GROQ_API_KEY,
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/run', async (req, res) => {
    if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
    try {
        return res.json(await generateAndPublishNext());
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Submit every URL (from the live sitemap) to IndexNow + Google Indexing API.
app.post('/api/admin/ping-all', async (req, res) => {
    if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
    try {
        const xml = await (await fetch(`${SITE_URL}/sitemap.xml`)).text();
        const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        const inx = await indexNowSubmit(urls);
        let google = null;
        if (process.env.GOOGLE_SA_KEY) {
            const { googleIndexSubmit } = await import('../scripts/lib/google-index.mjs');
            google = await googleIndexSubmit(urls);
        }
        return res.json({ ok: true, count: urls.length, indexnow: inx, google });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Export the app for Vercel Serverless
export default app;

// Only listen if running locally (not in Vercel environment)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
