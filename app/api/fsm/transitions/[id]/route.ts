import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            fromStateId,
            toStateId,
            triggerType,
            triggerEvent,
            timeFrom,
            timeoutMinutes,
            priority,
            conditions,
            actions
        } = body;

        // Use transaction to update fields and replace nested relations
        const transition = await prisma.$transaction(async (tx) => {
            // 1. Update main fields
            const t = await tx.fSMTransition.update({
                where: { id },
                data: {
                    fromStateId,
                    toStateId,
                    triggerType,
                    triggerEvent,
                    timeFrom,
                    timeoutMinutes: timeoutMinutes ? parseInt(timeoutMinutes) : null,
                    priority,
                }
            });

            // 2. Replace Conditions (Delete All -> Create New)
            await tx.fSMCondition.deleteMany({ where: { transitionId: id } });
            if (conditions && conditions.length > 0) {
                await tx.fSMCondition.createMany({
                    data: conditions.map((c: any) => ({
                        transitionId: id,
                        field: c.field,
                        operator: c.operator,
                        value: c.value,
                        groupId: c.groupId || 0,
                    }))
                });
            }

            // 3. Replace Actions (Delete All -> Create New)
            await tx.fSMAction.deleteMany({ where: { transitionId: id } });
            if (actions && actions.length > 0) {
                await tx.fSMAction.createMany({
                    data: actions.map((a: any) => ({
                        transitionId: id,
                        type: a.type,
                        config: a.config,
                        order: a.order || 0,
                    }))
                });
            }

            return await tx.fSMTransition.findUnique({
                where: { id },
                include: { conditions: true, actions: true }
            });
        });

        return NextResponse.json(transition);
    } catch (error) {
        console.error(`Failed to update transition:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.fSMTransition.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Failed to delete transition:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
