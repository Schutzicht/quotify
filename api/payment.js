import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { amount } = req.body;

        console.log('--- START PAYMENT DEBUG ---');
        console.log('Stripe Lib Version:', Stripe.PACKAGE_VERSION || 'Unknown');
        console.log('API Version Config:', stripe.getApiField('version')); // Internal getter often works, or just trust the init
        console.log('Request Amount:', amount);

        // Create Embedded Checkout Session
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Offerte PDF Download',
                        },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Using automatic methods is best for Apple Pay / Google Pay / iDEAL
            automatic_payment_methods: { enabled: true },
            return_url: `${req.headers.origin}?session_id={CHECKOUT_SESSION_ID}`,
        });

        res.json({ clientSecret: session.client_secret });
    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({ error: err.message });
    }
}
