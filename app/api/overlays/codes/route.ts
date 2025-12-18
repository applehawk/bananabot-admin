import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const overlays = await prisma.overlay.findMany({
            select: {
                code: true
            }
        });

        const codes = overlays.map(o => o.code);

        return NextResponse.json({ codes });
    } catch (error) {
        console.error('Failed to fetch overlay codes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch overlay codes' },
            { status: 500 }
        );
    }
}
