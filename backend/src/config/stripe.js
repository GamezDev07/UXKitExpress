import Stripe from 'stripe';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

export default stripe;
