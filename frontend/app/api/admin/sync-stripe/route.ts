import { NextRequest, NextResponse } from 'next/server';
import { StripeSync } from '@/lib/sync-stripe';

export async function POST(req: NextRequest) {
    try {
        console.log('🚀 API: Iniciando sincronización manual de packs...');

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
                    missing: {
                        stripe: !stripeKey,
                        supabaseUrl: !supabaseUrl,
                        supabaseKey: !supabaseServiceKey,
                    },
                },
                { status: 500 }
            );
        }

        // Crear instancia de sincronización
        const syncService = new StripeSync(stripeKey, supabaseUrl, supabaseServiceKey);

        // Ejecutar sincronización
        const result = await syncService.syncAllPacks();

        console.log('✅ Sincronización completada:', result);

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error('❌ Error en API de sincronización:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error desconocido',
                details: error.stack,
            },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        console.log('📊 API: Obteniendo estado de sincronización...');

        // Validar variables de entorno
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        // Crear instancia de sincronización
        const syncService = new StripeSync(stripeKey, supabaseUrl, supabaseServiceKey);

        // Obtener estado
        const status = await syncService.getSyncStatus();

        console.log('✅ Estado obtenido:', status);

        return NextResponse.json(status, { status: 200 });

    } catch (error: any) {
        console.error('❌ Error obteniendo estado:', error);

        return NextResponse.json(
            { error: error.message || 'Error desconocido' },
            { status: 500 }
        );
    }
}
