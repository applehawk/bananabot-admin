import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FSMServiceHelper } from '@/lib/fsm';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: stateId } = await params;

        // Get all users in this state
        const users = await prisma.userFSMState.findMany({
            where: { stateId },
            select: { userId: true }
        });

        let processed = 0;
        for (const u of users) {
            await FSMServiceHelper.processUserStrict(u.userId);
            processed++;
        }

        return NextResponse.json({ success: true, processed, message: "State checks triggered. Note: Actions like sending messages may not execute from Admin context." });
    } catch (error) {
        console.error('Process state error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
