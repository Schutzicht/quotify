import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
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

// 1. Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
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
            return_url: `${req.headers.origin}?session_id={CHECKOUT_SESSION_ID}`,
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
            event = JSON.parse(req.body);
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
