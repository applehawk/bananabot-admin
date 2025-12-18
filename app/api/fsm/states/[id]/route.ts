
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, description, positionX, positionY, isTerminal, isInitial } = body;

        const state = await prisma.fSMState.update({
            where: { id },
            data: {
                name,
                description,
                positionX,
                positionY,
                isTerminal,
                isInitial,
            },
        });

        return NextResponse.json(state);
    } catch (error) {
        console.error(`Failed to update state:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.fSMState.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Failed to delete state:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
