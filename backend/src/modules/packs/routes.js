import express from 'express';
import stripe from '../../config/stripe.js';
import supabaseAdmin from '../../config/supabase.js';
import { authenticate } from '../../middleware/auth.js';
import { catchAsync } from '../../middleware/errorHandler.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// GET /api/packs - Listar packs
router.get('/', catchAsync(async (req, res) => {
    const { data: packs } = await supabaseAdmin
        .from('packs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    res.json({ packs });
}));

// POST /api/packs/purchase - Comprar pack
router.post('/purchase', authenticate, catchAsync(async (req, res) => {
    const userId = req.user.userId || req.user.sub;
    const { packId } = req.body;

    // Verificar pack
    const { data: pack } = await supabaseAdmin
        .from('packs')
        .select('*')
        .eq('id', packId)
        .single();

    if (!pack) return res.status(404).json({ error: 'Pack no encontrado' });

    // Verificar si ya compró
    const { data: existing } = await supabaseAdmin
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('pack_id', packId)
        .single();

    if (existing) {
        return res.status(400).json({ error: 'Ya compraste este pack' });
    }

    // Crear Stripe price si no existe
    if (!pack.stripe_price_id) {
        const product = await stripe.products.create({
            name: pack.name,
            metadata: { packId }
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(pack.price * 100),
            currency: 'usd'
        });

        await supabaseAdmin
            .from('packs')
            .update({
                stripe_product_id: product.id,
                stripe_price_id: price.id
            })
            .eq('id', packId);

        pack.stripe_price_id = price.id;
    }

    // Crear checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price: pack.stripe_price_id,
            quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/download/${packId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/packs`,
        metadata: { userId, packId, packName: pack.name }
    });

    res.json({ url: session.url });
}));

// GET /api/packs/download/:packId - Descargar
router.get('/download/:packId', authenticate, catchAsync(async (req, res) => {
    const userId = req.user.userId || req.user.sub;
    const { packId } = req.params;

    // Verificar compra
    const { data: purchase } = await supabaseAdmin
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('pack_id', packId)
        .single();

    if (!purchase) {
        return res.status(403).json({ error: 'No has comprado este pack' });
    }

    // Generar signed URL
    const fileName = `${packId}.zip`;
    const { data: signedUrl } = await supabaseAdmin.storage
        .from('pack-files')
        .createSignedUrl(fileName, 3600);

    // Incrementar contador
    await supabaseAdmin
        .from('purchases')
        .update({ download_count: purchase.download_count + 1 })
        .eq('id', purchase.id);

    res.json({ downloadUrl: signedUrl.signedUrl });
}));

export default router;
