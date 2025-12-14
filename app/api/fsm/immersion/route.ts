import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FSMServiceHelper } from '@/lib/fsm';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { versionId } = body; // Optional, defaults to active

        let targetVersionId = versionId;
        if (!targetVersionId) {
            const active = await prisma.fSMVersion.findFirst({ where: { isActive: true } });
            if (!active) return NextResponse.json({ error: 'No active version' }, { status: 400 });
            targetVersionId = active.id;
        }

        // Fetch all users? Or paginated?
        // Immersion is heavy. Ideally background job. For now, running for first 100 users or batched.
        // User asked for "Tool... with button".
        // We will try running for all users (might timeout) or just return a stream?
        // Let's do a batch of 500 for now.

        const users = await prisma.user.findMany({
            select: { id: true },
            // where: { fsmState: { is: null } } // Optional: only new? No, user said "preventive... based on history", implies updating existing.
            orderBy: { createdAt: 'desc' },
            take: 1000
        });

        let processed = 0;
        for (const user of users) {
            await FSMServiceHelper.immerseUser(user.id, targetVersionId);
            processed++;
        }

        return NextResponse.json({ success: true, processed });
    } catch (error) {
        console.error('Immersion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
