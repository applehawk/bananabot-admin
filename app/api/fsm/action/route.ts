
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FSMServiceHelper } from '@/lib/fsm';
import { FSMActionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userIds, action, config, conditions } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'No users provided' }, { status: 400 });
        }
        if (!action) {
            return NextResponse.json({ error: 'No action provided' }, { status: 400 });
        }

        // Validate Action Type
        if (!Object.keys(FSMActionType).includes(action)) {
            return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
        }

        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;
        const results = [];

        // LIMIT: 50 users max per batch to prevent timeout
        // The frontend should handle batching if list is huge, or we use a queue.
        // For now, simple loop is fine for admin manual triggers (<100 usually).
        const BATCH_LIMIT = 100;
        const usersToProcess = userIds.slice(0, BATCH_LIMIT);

        for (const userId of usersToProcess) {
            const res = await FSMServiceHelper.dispatchManualAction(userId, action as FSMActionType, config || {}, conditions);
            results.push({ userId, ...res });
            if (res.success) successCount++;
            else if ((res as any).skipped) skippedCount++;
            else failCount++;
        }

        return NextResponse.json({
            success: true,
            processed: usersToProcess.length,
            successCount,
            failCount,
            skippedCount,
            results,
            limitReached: userIds.length > BATCH_LIMIT
        });
    } catch (error) {
        console.error('Bulk Action API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
