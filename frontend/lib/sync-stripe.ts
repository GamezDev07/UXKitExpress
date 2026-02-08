import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Tipos
interface Pack {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stripe_product_id: string | null;
    stripe_price_id: string | null;
    is_published: boolean;
}

interface SyncResult {
    packId: string;
    packName: string;
    success: boolean;
    error?: string;
    stripeProductId?: string;
    stripePriceId?: string;
}

interface SyncSummary {
    success: boolean;
    total: number;
    synced: number;
    failed: number;
    details: SyncResult[];
}

// Inicializar clientes (se pasan desde API routes para usar variables de servidor)
export class StripeSync {
    private stripe: Stripe;
    private supabase: ReturnType<typeof createClient>;

    constructor(stripeSecretKey: string, supabaseUrl: string, supabaseServiceKey: string) {
        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2024-12-18.acacia',
        });

        this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    /**
     * Sincroniza un pack individual a Stripe
     */
    async syncPackToStripe(pack: Pack): Promise<SyncResult> {
        try {
            console.log(`🔄 Sincronizando pack: ${pack.name} (${pack.id})`);

            // Si ya tiene IDs de Stripe, verificar y actualizar si es necesario
            if (pack.stripe_product_id && pack.stripe_price_id) {
                try {
                    await this.stripe.products.retrieve(pack.stripe_product_id);
                    console.log(`✅ Pack ya tiene producto en Stripe, verificando actualizaciones...`);

                    // Verificar si necesita actualización
                    return await this.updateStripeProduct(pack);
                } catch (error: any) {
                    // Si el producto no existe en Stripe, recrearlo
                    if (error.code === 'resource_missing') {
                        console.log(`⚠️ Producto de Stripe no encontrado, recreando...`);
                    } else {
                        throw error;
                    }
                }
            }

            // Crear producto en Stripe con metadata extendida
            const productData: any = {
                name: pack.name,
                description: pack.description || undefined,
                metadata: {
                    packId: pack.id,
                    slug: pack.slug,
                    syncedAt: new Date().toISOString(),
                },
            };

            // Agregar campos opcionales si existen
            if ((pack as any).short_description) {
                productData.description = (pack as any).short_description;
            }
            if ((pack as any).components_count) {
                productData.metadata.components_count = (pack as any).components_count.toString();
            }
            if ((pack as any).thumbnail_url) {
                productData.images = [(pack as any).thumbnail_url];
            }

            const product = await this.stripe.products.create(productData);

            console.log(`✅ Producto creado en Stripe: ${product.id}`);

            // Crear precio en Stripe
            const price = await this.stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(pack.price * 100), // Convertir a centavos
                currency: 'usd',
                metadata: {
                    packId: pack.id,
                },
            });

            console.log(`✅ Precio creado en Stripe: ${price.id}`);

            // Actualizar pack en Supabase
            const { error: updateError } = await this.supabase
                .from('packs')
                .update({
                    stripe_product_id: product.id,
                    stripe_price_id: price.id,
                })
                .eq('id', pack.id);

            if (updateError) {
                console.error(`❌ Error actualizando Supabase:`, updateError);
                throw updateError;
            }

            console.log(`✅ Pack actualizado en Supabase: ${pack.id}`);

            return {
                packId: pack.id,
                packName: pack.name,
                success: true,
                stripeProductId: product.id,
                stripePriceId: price.id,
            };

        } catch (error: any) {
            console.error(`❌ Error sincronizando pack ${pack.name}:`, error);

            return {
                packId: pack.id,
                packName: pack.name,
                success: false,
                error: error.message || 'Error desconocido',
            };
        }
    }

    /**
     * Actualiza un producto existente en Stripe
     * Verifica si el precio cambió y crea uno nuevo si es necesario
     */
    private async updateStripeProduct(pack: Pack): Promise<SyncResult> {
        try {
            console.log(`🔄 Verificando actualización para: ${pack.name}`);

            // Preparar datos de actualización
            const updateData: any = {
                name: pack.name,
                description: pack.description || undefined,
                metadata: {
                    packId: pack.id,
                    slug: pack.slug,
                    syncedAt: new Date().toISOString(),
                },
            };

            // Agregar campos opcionales
            if ((pack as any).short_description) {
                updateData.description = (pack as any).short_description;
            }
            if ((pack as any).components_count) {
                updateData.metadata.components_count = (pack as any).components_count.toString();
            }
            if ((pack as any).thumbnail_url) {
                updateData.images = [(pack as any).thumbnail_url];
            }

            // Actualizar producto
            await this.stripe.products.update(pack.stripe_product_id!, updateData);
            console.log(`✅ Producto actualizado en Stripe`);

            // Verificar si el precio cambió
            const currentPrice = await this.stripe.prices.retrieve(pack.stripe_price_id!);
            const newPriceAmount = Math.round(pack.price * 100);

            if (currentPrice.unit_amount !== newPriceAmount) {
                console.log(`💰 Precio cambió de $${currentPrice.unit_amount! / 100} a $${pack.price}`);

                // Archivar precio anterior
                await this.stripe.prices.update(pack.stripe_price_id!, { active: false });
                console.log(`✅ Precio anterior archivado`);

                // Crear nuevo precio
                const newPrice = await this.stripe.prices.create({
                    product: pack.stripe_product_id!,
                    unit_amount: newPriceAmount,
                    currency: 'usd',
                    metadata: { packId: pack.id },
                });

                console.log(`✅ Nuevo precio creado: ${newPrice.id}`);

                // Actualizar en Supabase
                const { error: updateError } = await this.supabase
                    .from('packs')
                    .update({ stripe_price_id: newPrice.id })
                    .eq('id', pack.id);

                if (updateError) {
                    console.error(`⚠️ Error actualizando price_id en Supabase:`, updateError);
                }

                return {
                    packId: pack.id,
                    packName: pack.name,
                    success: true,
                    stripeProductId: pack.stripe_product_id!,
                    stripePriceId: newPrice.id,
                };
            }

            console.log(`✅ Pack actualizado (precio sin cambios): ${pack.name}`);

            return {
                packId: pack.id,
                packName: pack.name,
                success: true,
                stripeProductId: pack.stripe_product_id!,
                stripePriceId: pack.stripe_price_id!,
            };

        } catch (error: any) {
            console.error(`❌ Error actualizando producto:`, error);

            return {
                packId: pack.id,
                packName: pack.name,
                success: false,
                error: error.message || 'Error al actualizar',
            };
        }
    }

    /**
     * Sincroniza todos los packs pendientes (sin stripe_product_id)
     */
    async syncAllPacks(): Promise<SyncSummary> {
        console.log('🚀 Iniciando sincronización de todos los packs...');

        // Obtener packs sin stripe_product_id
        const { data: packs, error } = await this.supabase
            .from('packs')
            .select('*')
            .is('stripe_product_id', null)
            .eq('is_published', true);

        if (error) {
            console.error('❌ Error obteniendo packs:', error);
            throw error;
        }

        if (!packs || packs.length === 0) {
            console.log('✅ No hay packs pendientes de sincronización');
            return {
                success: true,
                total: 0,
                synced: 0,
                failed: 0,
                details: [],
            };
        }

        console.log(`📦 Encontrados ${packs.length} packs para sincronizar`);

        // Sincronizar cada pack
        const results: SyncResult[] = [];
        for (const pack of packs) {
            const result = await this.syncPackToStripe(pack);
            results.push(result);

            // Pequeño delay para evitar rate limits de Stripe
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const synced = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`✅ Sincronización completada: ${synced} exitosos, ${failed} fallidos`);

        return {
            success: failed === 0,
            total: packs.length,
            synced,
            failed,
            details: results,
        };
    }

    /**
     * Procesa packs de la cola de sincronización
     * @param limit - Cantidad máxima de packs a procesar (default: 10)
     */
    async processSyncQueue(limit: number = 10): Promise<SyncSummary> {
        console.log(`🔄 Procesando cola de sincronización (límite: ${limit})...`);

        // Obtener packs pendientes de la cola
        const { data: queueItems, error: queueError } = await this.supabase
            .from('sync_queue')
            .select('id, pack_id, attempts, packs(*)')
            .in('status', ['pending', 'failed'])
            .lt('attempts', 3) // Solo reintentar hasta 3 veces
            .order('created_at', { ascending: true })
            .limit(limit);

        if (queueError) {
            console.error('❌ Error obteniendo cola:', queueError);
            throw queueError;
        }

        if (!queueItems || queueItems.length === 0) {
            console.log('✅ Cola vacía');
            return {
                success: true,
                total: 0,
                synced: 0,
                failed: 0,
                details: [],
            };
        }

        console.log(`📦 ${queueItems.length} items en cola`);

        const results: SyncResult[] = [];

        for (const item of queueItems as any[]) {
            const pack = item.packs;

            if (!pack) {
                console.warn(`⚠️ Pack no encontrado para queue item ${item.id}`);
                continue;
            }

            // Marcar como procesando
            await this.supabase
                .from('sync_queue')
                .update({
                    status: 'processing',
                    attempts: item.attempts + 1,
                })
                .eq('id', item.id);

            // Sincronizar pack
            const result = await this.syncPackToStripe(pack);
            results.push(result);

            // Actualizar estado en la cola
            if (result.success) {
                await this.supabase
                    .from('sync_queue')
                    .update({
                        status: 'completed',
                        processed_at: new Date().toISOString(),
                        error_message: null,
                    })
                    .eq('id', item.id);
            } else {
                const newAttempts = item.attempts + 1;
                await this.supabase
                    .from('sync_queue')
                    .update({
                        status: newAttempts >= 3 ? 'failed' : 'pending',
                        error_message: result.error,
                    })
                    .eq('id', item.id);
            }

            // Delay para rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const synced = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`✅ Procesamiento de cola completado: ${synced} exitosos, ${failed} fallidos`);

        return {
            success: failed === 0,
            total: queueItems.length,
            synced,
            failed,
            details: results,
        };
    }

    /**
     * Obtiene el estado de sincronización
     */
    async getSyncStatus() {
        // Contar packs sincronizados
        const { count: syncedCount } = await this.supabase
            .from('packs')
            .select('*', { count: 'exact', head: true })
            .not('stripe_product_id', 'is', null);

        // Contar packs pendientes
        const { count: pendingCount } = await this.supabase
            .from('packs')
            .select('*', { count: 'exact', head: true })
            .is('stripe_product_id', null)
            .eq('is_published', true);

        // Contar items en cola
        const { count: queuePending } = await this.supabase
            .from('sync_queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { count: queueFailed } = await this.supabase
            .from('sync_queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'failed');

        return {
            synced: syncedCount || 0,
            pending: pendingCount || 0,
            queue: {
                pending: queuePending || 0,
                failed: queueFailed || 0,
            },
        };
    }

    /**
     * Archiva un producto de Stripe (cuando pack se despublica)
     */
    async archiveStripeProduct(packId: string): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`🗄️ Archivando producto de Stripe para pack: ${packId}`);

            const { data: pack } = await this.supabase
                .from('packs')
                .select('stripe_product_id, stripe_price_id, name')
                .eq('id', packId)
                .single();

            if (!pack?.stripe_product_id) {
                console.log(`⚠️ Pack no tiene producto de Stripe para archivar`);
                return { success: true };
            }

            // Archivar precio
            if (pack.stripe_price_id) {
                await this.stripe.prices.update(pack.stripe_price_id, { active: false });
                console.log(`✅ Precio archivado: ${pack.stripe_price_id}`);
            }

            // Archivar producto
            await this.stripe.products.update(pack.stripe_product_id, { active: false });
            console.log(`✅ Producto archivado: ${pack.stripe_product_id}`);

            return { success: true };
        } catch (error: any) {
            console.error(`❌ Error archivando producto:`, error);
            return {
                success: false,
                error: error.message || 'Error al archivar producto',
            };
        }
    }
}
