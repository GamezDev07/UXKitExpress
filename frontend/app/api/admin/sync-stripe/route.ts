/**
 * API Route: /api/admin/sync-stripe
 * 
 * POST - Sincronizar todos los packs pendientes
 * GET - Obtener estado de sincronización
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAllPacks, getSyncStatus } from '@/lib/sync-stripe'

/**
 * POST - Sincronizar todos los packs
 */
export async function POST(req: NextRequest) {
    try {
        console.log('🚀 Manual sync initiated')

        // Verificar variables de entorno
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: 'STRIPE_SECRET_KEY not configured' },
                { status: 500 }
            )
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
                { status: 500 }
            )
        }

        // Ejecutar sincronización
        const result = await syncAllPacks()

        console.log(`✅ Sync completed: ${result.synced}/${result.total} successful`)

        return NextResponse.json(result, { status: 200 })
    } catch (error: any) {
        console.error('❌ Sync failed:', error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Sync failed',
                details: error.toString(),
            },
            { status: 500 }
        )
    }
}

/**
 * GET - Obtener estado de sincronización
 */
export async function GET(req: NextRequest) {
    try {
        const status = await getSyncStatus()

        return NextResponse.json(status, { status: 200 })
    } catch (error: any) {
        console.error('❌ Error getting status:', error)

        return NextResponse.json(
            {
                error: error.message || 'Failed to get status',
            },
            { status: 500 }
        )
    }
}
