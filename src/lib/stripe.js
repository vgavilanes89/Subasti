import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

export function getStripePromise() {
    if (!stripePromise) {
        const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
        stripePromise = key ? loadStripe(key) : Promise.resolve(null);
    }
    return stripePromise;
}
