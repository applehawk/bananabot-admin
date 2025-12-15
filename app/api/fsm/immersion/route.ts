import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FSMServiceHelper } from '@/lib/fsm';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { versionId, skip = 0, take = 50 } = body; // Optional, defaults to active

        let targetVersionId = versionId;
        if (!targetVersionId) {
            const active = await prisma.fSMVersion.findFirst({ where: { isActive: true } });
            if (!active) return NextResponse.json({ error: 'No active version' }, { status: 400 });
            targetVersionId = active.id;
        }

        // Fetch paginated users
        const users = await prisma.user.findMany({
            select: { id: true },
            orderBy: { createdAt: 'desc' },
            skip: Number(skip),
            take: Number(take),
        });

        // Get total count for progress tracking (only returned on first batch might be enough, but useful every time)
        const totalUsers = await prisma.user.count();

        let processed = 0;
        for (const user of users) {
            await FSMServiceHelper.immerseUser(user.id, targetVersionId);
            processed++;
        }

        return NextResponse.json({ success: true, processed, totalUsers });
    } catch (error) {
        console.error('Immersion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
