/**
 * SYNC STRIPE - Core Library
 * Ubicación: /lib/sync-stripe.ts
 * 
 * Funciones para sincronizar packs de Supabase con Stripe
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getStripe() {
    if (!stripeInstance) {
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-01-28.clover',
        })
    }
    return stripeInstance
}

function getSupabase() {
    if (!supabaseInstance) {
        supabaseInstance = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }
    return supabaseInstance
}

/**
 * Sincronizar un pack específico con Stripe
 */
export async function syncPackToStripe(packId: string) {
    try {
        const supabase = getSupabase()
        const { data: pack, error } = await supabase
            .from('packs')
            .select('*')
            .eq('id', packId)
            .single()

        if (error || !pack) {
            throw new Error(`Pack not found: ${packId}`)
        }

        console.log(`📦 Syncing pack: ${pack.name}`)

        // Si ya tiene producto, saltar
        if (pack.stripe_product_id) {
            console.log(`✓ Pack already has Stripe product: ${pack.stripe_product_id}`)
            return {
                success: true,
                already_synced: true,
                pack_id: pack.id,
                stripe_product_id: pack.stripe_product_id,
                stripe_price_id: pack.stripe_price_id
            }
        }

        // Crear producto en Stripe
        const stripe = getStripe()`n        const stripeProduct = await stripe.products.create({
            name: pack.name,
            description: pack.short_description || pack.description,
            metadata: {
                pack_id: pack.id,
                pack_slug: pack.slug,
                components_count: pack.components_count?.toString() || '0',
            },
        })

        console.log(`✅ Created Stripe product: ${stripeProduct.id}`)

        // Crear precio en Stripe
        const stripe = getStripe()`n        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(pack.price * 100), // Convertir a centavos
            currency: 'usd',
            metadata: {
                pack_id: pack.id,
            },
        })

        console.log(`✅ Created Stripe price: ${stripePrice.id}`)

        // Actualizar pack en Supabase
        const supabase = getSupabase()`n        const { error: updateError } = await supabase
            .from('packs')
            .update({
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', pack.id)

        if (updateError) {
            throw new Error(`Failed to update pack: ${updateError.message}`)
        }

        console.log(`✅ Pack synced successfully: ${pack.name}`)

        return {
            success: true,
            pack_id: pack.id,
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id,
        }
    } catch (error) {
        console.error(`❌ Error syncing pack:`, error)
        throw error
    }
}

/**
 * Sincronizar todos los packs publicados con Stripe
 */
export async function syncAllPacks() {
    try {
        console.log(`🔄 Starting full sync...`)

        // Obtener todos los packs publicados
        const supabase = getSupabase()`n        const { data: packs, error } = await supabase
            .from('packs')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: true })

        if (error || !packs) {
            throw new Error(`Failed to fetch packs: ${error?.message}`)
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
                console.error(`Failed to sync pack ${pack.name}:`, error)
                results.push({
                    success: false,
                    pack_id: pack.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            }
        }

        const successCount = results.filter((r) => r.success).length
        console.log(`✅ Sync complete: ${successCount}/${packs.length} successful`)

        return {
            total: packs.length,
            successful: successCount,
            failed: packs.length - successCount,
            results,
        }
    } catch (error) {
        console.error(`❌ Full sync failed:`, error)
        throw error
    }
}

/**
 * Obtener estado de sincronización de todos los packs
 */
export async function getSyncStatus() {
    try {
        const supabase = getSupabase()`n        const { data: packs, error } = await supabase
            .from('packs')
            .select('id, name, slug, price, stripe_product_id, stripe_price_id, is_published')
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch packs: ${error.message}`)
        }

        // Analizar estado de sincronización
        const syncStatus = packs?.map((pack) => ({
            id: pack.id,
            name: pack.name,
            slug: pack.slug,
            price: pack.price,
            is_published: pack.is_published,
            synced: !!(pack.stripe_product_id && pack.stripe_price_id),
            stripe_product_id: pack.stripe_product_id,
            stripe_price_id: pack.stripe_price_id,
            needs_sync: pack.is_published && !pack.stripe_product_id,
        }))

        const stats = {
            total: packs?.length || 0,
            synced: syncStatus?.filter((p) => p.synced).length || 0,
            needs_sync: syncStatus?.filter((p) => p.needs_sync).length || 0,
            unpublished: syncStatus?.filter((p) => !p.is_published).length || 0,
        }

        return {
            stats,
            packs: syncStatus,
        }
    } catch (error) {
        console.error('Error getting sync status:', error)
        throw error
    }
}

/**
 * Archivar producto de Stripe (cuando pack se despublica)
 */
export async function archiveStripeProduct(packId: string) {
    try {
        const { data: pack } = await getSupabase()
            .from('packs')
            .select('stripe_product_id, stripe_price_id')
            .eq('id', packId)
            .single()

        if (!pack?.stripe_product_id) {
            console.log(`Pack has no Stripe product to archive`)
            return
        }

        // Archivar precio
        if (pack.stripe_price_id) {
            await getStripe().prices.update(pack.stripe_price_id, { active: false })
            console.log(`✓ Archived Stripe price: ${pack.stripe_price_id}`)
        }

        // Archivar producto
        await getStripe().products.update(pack.stripe_product_id, { active: false })
        console.log(`✅ Archived Stripe product: ${pack.stripe_product_id}`)

        return {
            success: true,
            archived_product: pack.stripe_product_id,
            archived_price: pack.stripe_price_id,
        }
    } catch (error) {
        console.error(`❌ Error archiving product:`, error)
        throw error
    }
}

/**
 * Actualizar producto existente en Stripe
 * (por si cambió el nombre, descripción o precio)
 */
export async function updateStripeProduct(packId: string) {
    try {
        const supabase = getSupabase()`n        const { data: pack, error } = await supabase
            .from('packs')
            .select('*')
            .eq('id', packId)
            .single()

        if (error || !pack) {
            throw new Error(`Pack not found: ${packId}`)
        }

        if (!pack.stripe_product_id) {
            throw new Error(`Pack has no Stripe product to update`)
        }

        console.log(`🔄 Updating Stripe product: ${pack.name}`)

        // Actualizar producto
        await getStripe().products.update(pack.stripe_product_id, {
            name: pack.name,
            description: pack.short_description || pack.description,
            metadata: {
                pack_id: pack.id,
                pack_slug: pack.slug,
                components_count: pack.components_count?.toString() || '0',
            },
        })

        // Verificar si el precio cambió
        const stripe = getStripe()`n        const currentPrice = await stripe.prices.retrieve(pack.stripe_price_id)
        const newPriceAmount = Math.round(pack.price * 100)

        if (currentPrice.unit_amount !== newPriceAmount) {
            console.log(`💰 Price changed, creating new price...`)

            // Archivar precio anterior
            await getStripe().prices.update(pack.stripe_price_id, { active: false })

            // Crear nuevo precio
            const stripe = getStripe()`n        const newPrice = await stripe.prices.create({
                product: pack.stripe_product_id,
                unit_amount: newPriceAmount,
                currency: 'usd',
                metadata: { pack_id: pack.id },
            })

            // Actualizar en Supabase
            await getSupabase()
                .from('packs')
                .update({ stripe_price_id: newPrice.id })
                .eq('id', pack.id)

            console.log(`✅ Created new price: ${newPrice.id}`)
        }

        console.log(`✅ Product updated successfully`)

        return {
            success: true,
            pack_id: pack.id,
            stripe_product_id: pack.stripe_product_id,
        }
    } catch (error) {
        console.error(`❌ Error updating product:`, error)
        throw error
    }
}



