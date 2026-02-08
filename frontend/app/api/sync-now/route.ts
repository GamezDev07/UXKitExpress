/**
 * EMERGENCY SYNC ENDPOINT
 * Ubicación: /app/api/sync-now/route.ts
 * 
 * Endpoint ultra simple para sincronizar sin autenticación
 * BORRAR después de usar
 */

import { NextResponse } from 'next/server'
import { syncAllPacks } from '@/lib/sync-stripe'

export async function GET() {
    try {
        console.log('🔄 Starting emergency sync...')

        const result = await syncAllPacks()

        console.log('✅ Sync completed:', result)

        return NextResponse.json({
            success: true,
            message: `Synced ${result.successful}/${result.total} packs`,
            ...result
        })
    } catch (error: any) {
        console.error('❌ Sync error:', error)

        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
