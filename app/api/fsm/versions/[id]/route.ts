import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const version = await prisma.fSMVersion.findUnique({
            where: { id },
            include: {
                states: {
                    orderBy: { name: 'asc' },
                    include: {
                        // Include counts or minimal info?
                        // For editor, we need full info
                    }
                },
                transitions: {
                    include: {
                        conditions: true,
                        actions: true,
                    }
                }
            },
        });

        if (!version) {
            return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        }

        return NextResponse.json(version);
    } catch (error) {
        console.error(`Failed to fetch FSM version: `, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        const body = await req.json();

        // If setting active, we might want to deactivate others in a transaction
        if (body.isActive) {
            await prisma.$transaction([
                prisma.fSMVersion.updateMany({
                    where: { id: { not: id } },
                    data: { isActive: false }
                }),
                prisma.fSMVersion.update({
                    where: { id },
                    data: { ...body }
                })
            ]);
        } else {
            await prisma.fSMVersion.update({
                where: { id },
                data: { ...body }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update FSM version:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
