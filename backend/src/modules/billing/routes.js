import express from 'express';
import stripe from '../../config/stripe.js';
import supabaseAdmin from '../../config/supabase.js';
import { billingSchemas } from '../../utils/validations.js';
import { authenticate } from '../../middleware/auth.js';
import { catchAsync } from '../../middleware/errorHandler.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Price IDs reales de Stripe (modo prueba)
const PLAN_PRICES = {
  basic: {
    monthly: 'price_1SuS3sRvVC1jNvC8W0mldOUj',
    yearly: 'price_1SuSOFRvVC1jNvC8dygnEfhg'
  },
  advance: {
    monthly: 'price_1SuS5JRvVC1jNvC88SBumeUh',
    yearly: 'price_1SuSPBRvVC1jNvC8wQ89Ug8a'
  },
  pro: {
    monthly: 'price_1SuS6NRvVC1jNvC81VZLl3HT',
    yearly: 'price_1SuSPxRvVC1jNvC8cd4oloZ2'
  },
  professional: {
    monthly: 'price_1SuS6NRvVC1jNvC81VZLl3HT',
    yearly: 'price_1SuSPxRvVC1jNvC8cd4oloZ2'
  },
  enterprise: {
    monthly: 'price_1SuS7jRvVC1jNvC88Vf2REJG',
    yearly: 'price_1SuSURRvVC1jNvC8T35iDOiD'
  }
};

// Test endpoint - verificar que las rutas están registradas
router.get('/', (req, res) => {
  logger.info('Billing routes test endpoint called');
  res.json({
    status: 'Billing API active',
    message: 'Billing routes are properly registered',
    endpoints: {
      'POST /create-checkout': 'Create Stripe checkout session (no auth)',
      'POST /create-checkout-session': 'Create checkout session (auth required)',
      'POST /webhook': 'Stripe webhook handler',
      'GET /subscription': 'Get subscription details',
      'POST /cancel-subscription': 'Cancel subscription',
      'POST /create-portal-session': 'Create billing portal session'
    }
  });
});

// ===== NUEVO ENDPOINT: Checkout SIN autenticación =====
// Para usuarios que seleccionan plan ANTES de registrarse
router.post('/create-checkout', catchAsync(async (req, res) => {
  const { plan, interval } = req.body;

  logger.info('Creating checkout session for:', { plan, interval });

  // Validar datos
  if (!plan || !interval) {
    return res.status(400).json({
      error: 'Plan e interval son requeridos'
    });
  }

  // Normalizar nombre del plan
  const planKey = plan.toLowerCase();
  const intervalKey = interval.toLowerCase();

  // Obtener Price ID de Stripe
  const priceId = PLAN_PRICES[planKey]?.[intervalKey];

  if (!priceId) {
    logger.error('Invalid plan:', `${planKey}-${intervalKey}`);
    return res.status(400).json({
      error: 'Plan no válido',
      received: { plan, interval },
      validPlans: Object.keys(PLAN_PRICES)
    });
  }

  // Crear sesión de checkout
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/signup?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&interval=${interval}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
    allow_promotion_codes: true,
    metadata: {
      plan,
      interval
    }
  });

  logger.info('Checkout session created:', session.id);

  res.json({ url: session.url });
}));

// Crear sesión de checkout
router.post('/create-checkout-session', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { plan, billingInterval, successUrl, cancelUrl } = billingSchemas.checkout.parse(req.body);

  // Obtener usuario
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  // Crear o recuperar cliente en Stripe
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId }
    });
    customerId = customer.id;

    // Actualizar usuario con customer ID
    await supabaseAdmin
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  // Obtener precio según plan e intervalo
  const priceId = PLAN_PRICES[plan][billingInterval];
  if (!priceId) {
    return res.status(400).json({ error: 'Plan no válido' });
  }

  // Crear sesión de checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    mode: 'subscription',
    success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/pricing`,
    metadata: {
      userId,
      plan,
      billingInterval
    }
  });

  logger.info(`Sesión de checkout creada para usuario ${userId}, plan ${plan}`);

  res.json({ sessionId: session.id, url: session.url });
}));

// WEBHOOK DE STRIPE - AHORA CORREGIDO
// NOTA: Esta ruta se maneja de forma especial en server.js para usar express.raw()
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // req.body debe ser el raw body (Buffer) para que esto funcione
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Webhook recibido: ${event.type}`);

  // Manejar el evento
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        logger.info(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// Funciones para manejar webhooks
async function handleCheckoutCompleted(session) {
  const { userId, plan } = session.metadata;

  logger.info(`Checkout completado para usuario ${userId}, plan ${plan}`);

  // Actualizar plan del usuario
  await supabaseAdmin
    .from('users')
    .update({
      current_plan: plan,
      stripe_subscription_id: session.subscription,
      subscription_status: 'active'
    })
    .eq('id', userId);

  // Registrar transacción
  await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      stripe_payment_id: session.payment_intent,
      amount: session.amount_total / 100,
      currency: session.currency,
      plan,
      status: 'completed'
    });
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  // Buscar usuario por customer ID
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    const status = subscription.status;
    await supabaseAdmin
      .from('users')
      .update({ subscription_status: status })
      .eq('id', user.id);

    logger.info(`Suscripción actualizada para usuario ${user.id}, status: ${status}`);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  // Buscar usuario y actualizar a plan free
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    await supabaseAdmin
      .from('users')
      .update({
        current_plan: 'free',
        subscription_status: 'inactive',
        stripe_subscription_id: null
      })
      .eq('id', user.id);

    logger.info(`Suscripción cancelada para usuario ${user.id}`);
  }
}

async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    logger.info(`Pago exitoso para usuario ${user.email}`);

    // Aquí podrías enviar un email de confirmación
    // await sendPaymentConfirmationEmail(user.email, invoice);
  }
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (user) {
    logger.warn(`Pago fallido para usuario ${user.email}`);

    // Aquí podrías enviar un email notificando el fallo
    // await sendPaymentFailedEmail(user.email, invoice);
  }
}

// Obtener estado de suscripción
router.get('/subscription', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('current_plan, subscription_status, stripe_subscription_id')
    .eq('id', userId)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  let subscriptionDetails = null;
  if (user.stripe_subscription_id) {
    try {
      subscriptionDetails = await stripe.subscriptions.retrieve(
        user.stripe_subscription_id
      );
    } catch (error) {
      logger.error('Error retrieving subscription:', error);
    }
  }

  res.json({
    plan: user.current_plan,
    status: user.subscription_status,
    subscription: subscriptionDetails
  });
}));

// Cancelar suscripción
router.post('/cancel-subscription', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single();

  if (!user?.stripe_subscription_id) {
    return res.status(400).json({ error: 'No hay suscripción activa' });
  }

  // Cancelar al final del período
  const subscription = await stripe.subscriptions.update(
    user.stripe_subscription_id,
    { cancel_at_period_end: true }
  );

  logger.info(`Usuario ${userId} canceló su suscripción`);

  res.json({
    message: 'Suscripción cancelada al final del período',
    subscription
  });
}));

// Portal de cliente (para gestionar suscripción)
router.post('/create-portal-session', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!user?.stripe_customer_id) {
    return res.status(400).json({ error: 'No hay cliente de Stripe asociado' });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL}/dashboard`,
  });

  res.json({ url: session.url });
}));

export default router;
