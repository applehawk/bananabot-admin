import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { enabled } = body;

        await prisma.systemSettings.upsert({
            where: { id: 'singleton' },
            create: { key: 'main', isRetentionEnabled: enabled },
            update: { isRetentionEnabled: enabled },
        });

        return NextResponse.json({ success: true, enabled });
    } catch (error) {
        console.error('Toggle FSM error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
