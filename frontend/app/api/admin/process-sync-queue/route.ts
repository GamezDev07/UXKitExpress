import { NextRequest, NextResponse } from 'next/server';
import { StripeSync } from '@/lib/sync-stripe';

export async function POST(req: NextRequest) {
    try {
        console.log('⏰ CRON JOB: Procesando cola de sincronización...');

        // Validar variables de entorno
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Faltan variables de entorno');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Configuración del servidor incompleta',
                },
                { status: 500 }
            );
        }

        // Crear instancia de sincronización
        const syncService = new StripeSync(stripeKey, supabaseUrl, supabaseServiceKey);

        // Procesar cola (máximo 10 items por ejecución para evitar timeouts)
        const result = await syncService.processSyncQueue(10);

        console.log('✅ Procesamiento de cola completado:', result);

        // Log detallado para monitoreo
        if (result.failed > 0) {
            console.warn(`⚠️ ${result.failed} packs fallaron en la sincronización`);
            result.details
                .filter(d => !d.success)
                .forEach(d => {
                    console.error(`  - ${d.packName}: ${d.error}`);
                });
        }

        return NextResponse.json(
            {
                ...result,
                timestamp: new Date().toISOString(),
                cronJob: true,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('❌ Error en cron job de procesamiento:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error desconocido',
                timestamp: new Date().toISOString(),
                cronJob: true,
            },
            { status: 500 }
        );
    }
}

// Endpoint GET para verificar manualmente el estado
export async function GET(req: NextRequest) {
    try {
        console.log('📊 Verificación manual de cola...');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const stripeKey = process.env.STRIPE_SECRET_KEY;

        if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        const syncService = new StripeSync(stripeKey, supabaseUrl, supabaseServiceKey);
        const status = await syncService.getSyncStatus();

        return NextResponse.json(
            {
                ...status,
                message: 'Cola de sincronización - Estado actual',
                nextCronRun: 'Cada 10 minutos (solo en producción)',
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('❌ Error verificando cola:', error);

        return NextResponse.json(
            { error: error.message || 'Error desconocido' },
            { status: 500 }
        );
    }
}
