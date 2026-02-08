/**
 * SYNC STRIPE - Core Library
 * Librería simple para sincronizar packs de Supabase con Stripe
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Inicializar clientes
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Sincroniza un pack individual con Stripe
 */
export async function syncPackToStripe(packId: string) {
    try {
        const { data: pack, error } = await supabase
            .from('packs')
            .select('*')
            .eq('id', packId)
            .single()

        if (error || !pack) {
            throw new Error(`Pack not found: ${packId}`)
        }

        console.log(`📦 Syncing pack: ${pack.name}`)

        // Si ya tiene producto, retornar sin hacer nada
        if (pack.stripe_product_id) {
            console.log(`✓ Pack already has Stripe product: ${pack.stripe_product_id}`)
            return {
                success: true,
                already_synced: true,
                pack_id: pack.id,
                stripe_product_id: pack.stripe_product_id,
                stripe_price_id: pack.stripe_price_id,
            }
        }

        // Crear producto en Stripe
        const stripeProduct = await stripe.products.create({
            name: pack.name,
            description: pack.short_description || pack.description,
            metadata: {
                pack_id: pack.id,
                pack_slug: pack.slug,
            },
        })

        console.log(`✅ Created Stripe product: ${stripeProduct.id}`)

        // Crear precio en Stripe
        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(pack.price * 100),
            currency: 'usd',
            metadata: { pack_id: pack.id },
        })

        console.log(`✅ Created Stripe price: ${stripePrice.id}`)

        // Actualizar pack en Supabase
        const { error: updateError } = await supabase
            .from('packs')
            .update({
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id,
            })
            .eq('id', pack.id)

        if (updateError) {
            console.error(`❌ Error updating pack in Supabase:`, updateError)
            throw updateError
        }

        console.log(`✅ Pack synced successfully: ${pack.name}`)

        return {
            success: true,
            pack_id: pack.id,
            pack_name: pack.name,
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id,
        }
    } catch (error) {
        console.error(`❌ Error syncing pack:`, error)
        return {
            success: false,
            pack_id: packId,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Sincroniza todos los packs publicados con Stripe
 */
export async function syncAllPacks() {
    try {
        console.log(`🔄 Starting full sync...`)

        // Obtener todos los packs publicados sin stripe_product_id
        const { data: packs, error } = await supabase
            .from('packs')
            .select('*')
            .is('stripe_product_id', null)
            .eq('is_published', true)
            .order('created_at', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch packs: ${error.message}`)
        }

        if (!packs || packs.length === 0) {
            console.log(`✅ No packs need syncing`)
            return {
                success: true,
                total: 0,
                synced: 0,
                failed: 0,
                details: [],
            }
        }

        console.log(`📦 Found ${packs.length} packs to sync`)

        const results = []

        // Sincronizar cada pack
        for (const pack of packs) {
            try {
                const result = await syncPackToStripe(pack.id)
                results.push(result)

                // Pequeña pausa para evitar rate limits
                await new Promise((resolve) => setTimeout(resolve, 500))
            } catch (error) {
                results.push({
                    success: false,
                    pack_id: pack.id,
                    pack_name: pack.name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            }
        }

        const synced = results.filter((r) => r.success).length
        const failed = results.filter((r) => !r.success).length

        console.log(`✅ Sync complete: ${synced}/${packs.length} successful`)

        return {
            success: failed === 0,
            total: packs.length,
            synced,
            failed,
            details: results,
        }
    } catch (error) {
        console.error(`❌ Full sync failed:`, error)
        throw error
    }
}

/**
 * Obtiene el estado de sincronización
 */
export async function getSyncStatus() {
    try {
        // Contar packs sincronizados
        const { count: syncedCount } = await supabase
            .from('packs')
            .select('*', { count: 'exact', head: true })
            .not('stripe_product_id', 'is', null)
            .eq('is_published', true)

        // Contar packs pendientes
        const { count: pendingCount } = await supabase
            .from('packs')
            .select('*', { count: 'exact', head: true })
            .is('stripe_product_id', null)
            .eq('is_published', true)

        return {
            synced: syncedCount || 0,
            pending: pendingCount || 0,
        }
    } catch (error) {
        console.error(`❌ Error getting sync status:`, error)
        throw error
    }
}

/**
 * Archiva un producto de Stripe (cuando pack se despublica)
 */
export async function archiveStripeProduct(packId: string) {
    try {
        console.log(`🗄️ Archiving Stripe product for pack: ${packId}`)

        const { data: pack } = await supabase
            .from('packs')
            .select('stripe_product_id, stripe_price_id, name')
            .eq('id', packId)
            .single()

        if (!pack?.stripe_product_id) {
            console.log(`⚠️ Pack has no Stripe product to archive`)
            return { success: true }
        }

        // Archivar precio
        if (pack.stripe_price_id) {
            await stripe.prices.update(pack.stripe_price_id, { active: false })
            console.log(`✅ Archived price: ${pack.stripe_price_id}`)
        }

        // Archivar producto
        await stripe.products.update(pack.stripe_product_id, { active: false })
        console.log(`✅ Archived product: ${pack.stripe_product_id}`)

        return { success: true }
    } catch (error) {
        console.error(`❌ Error archiving product:`, error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}
