
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionStatus, TransactionType } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Fetch Aggregates (Replicating UserContextService Logic)
        const payments = await prisma.transaction.aggregate({
            where: { userId: user.id, status: TransactionStatus.COMPLETED, type: TransactionType.PURCHASE },
            _count: true,
            _max: { createdAt: true }
        });

        const lastFailedPayment = await prisma.transaction.findFirst({
            where: { userId: user.id, type: TransactionType.PURCHASE, status: TransactionStatus.FAILED },
            orderBy: { createdAt: 'desc' }
        });

        const lastGen = await prisma.generation.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Calculate Virtual Fields
        const totalPayments = payments._count;
        const lastPaymentAt = payments._max.createdAt || undefined;
        // Check if last payment attempt was a failure (and newer than success)
        const lastPaymentFailed = !!lastFailedPayment &&
            (!lastPaymentAt || lastFailedPayment.createdAt > lastPaymentAt);

        const now = Date.now();
        const daysSinceCreated = (now - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const hoursSinceLastPay = lastPaymentAt ? (now - lastPaymentAt.getTime()) / (1000 * 60 * 60) : undefined;
        const hoursSinceLastGen = lastGen ? (now - lastGen.createdAt.getTime()) / (1000 * 60 * 60) : undefined;

        // user.lastActiveAt might be null/undefined in some schemas, guarding if it exists in Admin schema type
        // The admin Prisma schema might differ slightly if not fully synced, but usually they share.
        // I will use user.updatedAt as fallback if lastActiveAt is missing or handled dynamically.
        // Assuming standard User model fields.
        const lastActive = (user as any).lastActiveAt || user.updatedAt;
        const hoursSinceLastActivity = (now - lastActive.getTime()) / (1000 * 60 * 60);

        // Low Balance Logic
        const CREDITS_NEEDED = 20;
        const isLowBalance = (user.credits || 0) < CREDITS_NEEDED;

        const context = {
            userId: user.id,
            userTags: user.tags || [],
            credits: user.credits || 0,
            totalGenerations: user.totalGenerated || 0,
            totalPayments,
            lastGenerationAt: lastGen?.createdAt || undefined,
            lastPaymentAt,
            lastPaymentFailed,
            createdAt: user.createdAt,
            preferredModel: lastGen?.modelId,

            // Virtual
            isPaidUser: totalPayments > 0,
            isLowBalance,
            daysSinceCreated: Math.floor(daysSinceCreated * 10) / 10, // Round for readability
            hoursSinceLastPay: hoursSinceLastPay ? Math.floor(hoursSinceLastPay * 10) / 10 : null,
            hoursSinceLastGen: hoursSinceLastGen ? Math.floor(hoursSinceLastGen * 10) / 10 : null,
            hoursSinceLastActivity: Math.floor(hoursSinceLastActivity * 10) / 10,

            // FSM/Payload placeholders (can be overridden in simulator)
            lifecycle: (user as any).lifecycleState || 'UNKNOWN'
        };

        return NextResponse.json(context);
    } catch (error) {
        console.error('Failed to fetch user context:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
