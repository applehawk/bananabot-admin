import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const updated = await prisma.ruleGroup.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to update group:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
