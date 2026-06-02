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
import { blogSlugsOnGithub, createPostPR } from '../scripts/lib/github.mjs';

dotenv.config();

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
        express.json()(req, res, next);
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

// 3. Auto-blog cron: generate the next queued post and open a pull request.
//    Scheduled in vercel.json. Needs env: GROQ_API_KEY, GITHUB_TOKEN
//    (optional: GITHUB_OWNER, GITHUB_REPO, GITHUB_BASE, CRON_SECRET).
app.get('/api/cron/generate-blog', async (req, res) => {
    // Optional shared secret. Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
    if (process.env.CRON_SECRET) {
        if ((req.headers.authorization || '') !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: 'unauthorized' });
        }
    }

    const token = process.env.GITHUB_TOKEN;
    const groqKey = process.env.GROQ_API_KEY;
    const owner = process.env.GITHUB_OWNER || 'Schutzicht';
    const repo = process.env.GITHUB_REPO || 'quotify';
    const base = process.env.GITHUB_BASE || 'main';

    if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN ontbreekt' });
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY ontbreekt' });

    try {
        // Source of truth for "what already exists" is the repo itself.
        const taken = await blogSlugsOnGithub(token, owner, repo);
        const topic = autoTopics.find((t) => t && t.slug && !taken.has(t.slug));
        if (!topic) return res.json({ status: 'leeg', message: 'Geen onderwerpen meer in de wachtrij.' });

        const post = await generatePostObject(topic, { apiKey: groqKey, slugList: [...taken] });
        post.date = new Date().toISOString().slice(0, 10);
        post.updated = post.date;

        const url = await createPostPR({
            token, owner, repo, base,
            slug: post.slug,
            fileContent: serializePost(post),
            title: `Nieuw blogartikel: ${post.title}`,
        });

        return res.json({ status: 'ok', slug: post.slug, pr: url });
    } catch (e) {
        console.error('Auto-blog cron error:', e);
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
