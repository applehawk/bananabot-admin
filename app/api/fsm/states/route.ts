import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const states = await prisma.fSMState.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                versionId: true,
                version: {
                    select: { name: true }
                }
            }
        });
        return NextResponse.json(states);
    } catch (error) {
        console.error('Failed to fetch FSM states:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { versionId, name, description, positionX, positionY, isTerminal, isInitial } = body;

        // TODO: Validation (Zod)

        // Check version
        const version = await prisma.fSMVersion.findUnique({ where: { id: versionId } });
        if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

        const state = await prisma.fSMState.create({
            data: {
                versionId,
                name,
                description,
                positionX: positionX || 0,
                positionY: positionY || 0,
                isTerminal: isTerminal || false,
                isInitial: isInitial || false,
            },
        });

        return NextResponse.json(state);
    } catch (error) {
        console.error('Failed to create FSM state:', error);
        // Unique constraint handling
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: 'State name must be unique within version' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
