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

// GET /api/packs/:slug - Obtener detalles de un pack
router.get('/:slug', catchAsync(async (req, res) => {
    const { slug } = req.params;

    console.log('=== GET PACK DETAILS ===');
    console.log('Slug:', slug);

    // Obtener pack
    const { data: pack, error: packError } = await supabaseAdmin
        .from('packs')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (packError || !pack) {
        console.log('Pack not found:', slug);
        return res.status(404).json({ error: 'Pack no encontrado' });
    }

    console.log('Pack found:', pack.id);

    // Verificar si el usuario autenticado ya lo compró
    let hasPurchased = false;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);

            // Usar Supabase client para verificar el token
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );

            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (authError || !user) {
                console.log('Token validation failed:', authError?.message);
            } else {
                const userId = user.id;

                console.log('Checking purchase for user:', userId);
                console.log('Pack ID:', pack.id);

                // ✅ USAR .maybeSingle() en lugar de .single()
                const { data: purchase, error: purchaseError } = await supabaseAdmin
                    .from('purchases')
                    .select('id, created_at')
                    .eq('user_id', userId)
                    .eq('pack_id', pack.id)
                    .maybeSingle();  // ← Devuelve null si no hay, NO lanza error

                console.log('Purchase query result:', { purchase, error: purchaseError });

                if (purchaseError) {
                    console.error('Error checking purchase:', purchaseError);
                } else if (purchase) {
                    console.log('✅ User has purchased this pack:', purchase.created_at);
                    hasPurchased = true;
                } else {
                    console.log('❌ User has NOT purchased this pack');
                }
            }

        } catch (error) {
            console.error('Error verifying purchase status:', error.message);
        }
    } else {
        console.log('No auth header provided');
    }

    console.log('Sending response - hasPurchased:', hasPurchased);

    res.json({ pack, hasPurchased });
}));


// POST /api/packs/purchase - Comprar pack
router.post('/purchase', authenticate, catchAsync(async (req, res) => {
    // Normalizar userId (puede venir como userId, sub, o id)
    const userId = req.user.userId || req.user.sub || req.user.id;
    const { packId } = req.body;

    console.log('=== PACK PURCHASE REQUEST ===');
    console.log('User object:', req.user);
    console.log('User ID extracted:', userId);
    console.log('Pack ID:', packId);
    console.log('Authorization header:', req.headers.authorization?.substring(0, 30) + '...');

    if (!userId) {
        console.error('❌ No user ID found in token');
        return res.status(401).json({
            error: 'Token inválido. Por favor inicia sesión de nuevo.'
        });
    }

    if (!packId) {
        console.error('❌ No pack ID provided');
        return res.status(400).json({ error: 'Pack ID requerido' });
    }

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
