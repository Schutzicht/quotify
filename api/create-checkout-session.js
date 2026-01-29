import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.origin}?success=true`,
            cancel_url: `${req.headers.origin}?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({ error: err.message });
    }
}
