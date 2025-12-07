import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

function serializeBigInt(obj: unknown): unknown {
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeBigInt);
    if (obj && typeof obj === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            out[k] = serializeBigInt(v);
        }
        return out;
    }
    return obj;
}

export async function POST(
    request: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> }
) {
    const params = await (context.params as any);
    const rawId = params?.id;
    if (!rawId) {
        return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    }

    const userId = String(rawId);

    try {
        const body = await request.json();
        const creditsValue = (body && (body.credits ?? body.amount)) ?? body;
        const amount = Number(creditsValue);

        if (!Number.isFinite(amount) || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
        }

        const deductBy = Math.floor(amount);

        // Check if user has enough credits or just allow negative balance?
        // Usually admin adjustments can go negative, but let's just decrement.

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: deductBy } },
        });

        await prisma.transaction.create({
            data: {
                userId: userId,
                type: 'ADMIN_ADJUSTMENT',
                creditsAdded: -deductBy, // Negative value for deduction
                paymentMethod: 'ADMIN',
                status: 'COMPLETED',
                description: `Deducted ${deductBy} credits by admin`,
                completedAt: new Date(),
                isFinal: true,
            },
        });

        const serializedUser = serializeBigInt(updatedUser);
        return NextResponse.json(serializedUser, { status: 200 });
    } catch (error) {
        console.error('Error deducting credits:', error);
        const errorResponse = handleDatabaseError(error);
        const status = (errorResponse && (errorResponse as any).status) ? (errorResponse as any).status : 500;
        return NextResponse.json(errorResponse ?? { error: 'Internal Server Error' }, { status });
    }
}
