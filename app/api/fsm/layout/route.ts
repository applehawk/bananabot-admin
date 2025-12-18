
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request) {
    try {
        const body = await req.json(); // Expects { nodes: [{ id, x, y }] }
        const { nodes } = body;

        if (!Array.isArray(nodes)) {
            return NextResponse.json({ error: 'Nodes array required' }, { status: 400 });
        }

        // Transactional update
        await prisma.$transaction(
            nodes.map((node: any) =>
                prisma.fSMState.update({
                    where: { id: node.id },
                    data: {
                        positionX: Math.round(node.x),
                        positionY: Math.round(node.y),
                    }
                })
            )
        );

        return NextResponse.json({ success: true, count: nodes.length });
    } catch (error) {
        console.error('Failed to update FSM layout:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
