import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { amount } = req.body; // Expecting amount in EUR (e.g. 10.00)

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Offerte Betaling',
                        },
                        unit_amount: Math.round(amount * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            automatic_payment_methods: { enabled: true },
            return_url: `${req.headers.origin}?session_id={CHECKOUT_SESSION_ID}`,
        });

        res.json({ clientSecret: session.client_secret });
    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({ error: err.message });
    }
}
