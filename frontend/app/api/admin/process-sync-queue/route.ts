/**
 * API Route: /api/admin/process-sync-queue
 * 
 * NOTA: Este endpoint ya no es necesario con la versión simple
 * Se mantiene por compatibilidad pero no hace nada
 * 
 * Para la versión simple, usa directamente /api/admin/sync-stripe
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    return NextResponse.json(
        {
            message: 'Queue processing not implemented in simple version',
            info: 'Use /api/admin/sync-stripe instead',
        },
        { status: 501 }
    )
}

export async function GET(req: NextRequest) {
    return NextResponse.json(
        {
            message: 'Queue status not available in simple version',
            info: 'Use /api/admin/sync-stripe (GET) for sync status',
        },
        { status: 501 }
    )
}
