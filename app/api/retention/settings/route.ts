import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { enabled } = await req.json();

        const settings = await prisma.systemSettings.upsert({
            where: { key: 'singleton' },
            update: { isRetentionEnabled: enabled },
            create: { key: 'singleton', isRetentionEnabled: enabled },
        });

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
