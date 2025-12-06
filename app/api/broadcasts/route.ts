import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleDatabaseError } from '@/lib/db-error-handler';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, scheduledFor } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const broadcast = await prisma.broadcast.create({
            data: {
                message,
                status: 'PENDING',
                scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            }
        });

        return NextResponse.json(broadcast);
    } catch (error) {
        return NextResponse.json(handleDatabaseError(error), { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const broadcasts = await prisma.broadcast.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json(broadcasts);
    } catch (error) {
        return NextResponse.json(handleDatabaseError(error), { status: 500 });
    }
}
