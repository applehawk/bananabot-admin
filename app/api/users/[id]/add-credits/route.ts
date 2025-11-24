import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export const dynamic = 'force-dynamic';

// Рекурсивная сериализация BigInt -> string (чтобы JSON не падал)
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
    context: { params: { id: string } | Promise<{ id: string }> } // допускаем Promise или синхронный объект
) {
    // await безопасен для Promise и для обычного объекта
    const params = await (context.params as any);
    const rawId = params?.id;
    if (!rawId) {
        return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    }

    // Приводим id к строке (если в вашей Prisma-схеме id — Int, замените на Number(rawId))
    const userId = String(rawId);

    try {
        const body = await request.json();
        const creditsValue = (body && (body.credits ?? body.amount)) ?? body;
        const amount = Number(creditsValue);

        if (!Number.isFinite(amount) || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
        }

        const incrementBy = Math.floor(amount);

        // Если в вашей Prisma-схеме User.id — string, используйте так:
        const updatedUser = await prisma.user.update({
            where: { id: userId }, // <-- строка
            data: { credits: { increment: incrementBy } },
        });

        // Запись транзакции: userId передаём как строку (соответствует схеме)
        await prisma.transaction.create({
            data: {
                userId: userId, // <-- строка, избегает ошибки типов
                type: 'ADMIN_ADJUSTMENT',
                creditsAdded: incrementBy,
                paymentMethod: 'ADMIN',
                status: 'COMPLETED',
                description: `Added ${incrementBy} credits by admin`,
                completedAt: new Date(),
                isFinal: true,
            },
        });

        const serializedUser = serializeBigInt(updatedUser);
        return NextResponse.json(serializedUser, { status: 200 });
    } catch (error) {
        console.error('Error adding credits:', error);
        const errorResponse = handleDatabaseError(error);
        const status = (errorResponse && (errorResponse as any).status) ? (errorResponse as any).status : 500;
        return NextResponse.json(errorResponse ?? { error: 'Internal Server Error' }, { status });
    }
}
